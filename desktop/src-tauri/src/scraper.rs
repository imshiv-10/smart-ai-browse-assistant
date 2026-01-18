use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ScraperError {
    #[error("Failed to fetch URL: {0}")]
    FetchError(#[from] reqwest::Error),
    #[error("Failed to parse HTML: {0}")]
    ParseError(String),
    #[error("Invalid URL: {0}")]
    InvalidUrl(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum PageType {
    Product,
    Article,
    Search,
    Other,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProductInfo {
    pub name: String,
    pub price: Option<f64>,
    pub currency: String,
    pub images: Vec<String>,
    pub description: String,
    pub rating: Option<f64>,
    pub review_count: Option<i32>,
    pub availability: String,
    pub brand: String,
    pub category: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ArticleInfo {
    pub author: String,
    pub publish_date: String,
    pub reading_time: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PageContent {
    pub url: String,
    pub title: String,
    pub description: String,
    pub text: String,
    pub page_type: PageType,
    pub extracted_at: String,
    pub product: Option<ProductInfo>,
    pub article: Option<ArticleInfo>,
}

pub async fn fetch_and_extract(url: &str) -> Result<PageContent, ScraperError> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()?;

    let response = client.get(url).send().await?;
    let html = response.text().await?;

    Ok(extract_from_html(&html, url))
}

pub fn extract_from_html(html: &str, url: &str) -> PageContent {
    let document = Html::parse_document(html);

    let title = extract_title(&document);
    let description = extract_description(&document);
    let text = extract_main_text(&document);
    let page_type = detect_page_type(&document, url);

    let product = if matches!(page_type, PageType::Product) {
        extract_product_info(&document)
    } else {
        None
    };

    let article = if matches!(page_type, PageType::Article) {
        extract_article_info(&document)
    } else {
        None
    };

    PageContent {
        url: url.to_string(),
        title,
        description,
        text,
        page_type,
        extracted_at: chrono::Utc::now().to_rfc3339(),
        product,
        article,
    }
}

fn extract_title(document: &Html) -> String {
    // Try og:title first
    if let Some(og_title) = select_meta_content(document, "og:title") {
        return og_title;
    }

    // Fall back to title tag
    let title_selector = Selector::parse("title").unwrap();
    document
        .select(&title_selector)
        .next()
        .map(|el| el.text().collect::<String>().trim().to_string())
        .unwrap_or_default()
}

fn extract_description(document: &Html) -> String {
    // Try og:description first
    if let Some(og_desc) = select_meta_content(document, "og:description") {
        return og_desc;
    }

    // Fall back to meta description
    let meta_selector = Selector::parse("meta[name='description']").unwrap();
    document
        .select(&meta_selector)
        .next()
        .and_then(|el| el.value().attr("content"))
        .map(|s| s.trim().to_string())
        .unwrap_or_default()
}

fn select_meta_content(document: &Html, property: &str) -> Option<String> {
    let selector = Selector::parse(&format!("meta[property='{}']", property)).ok()?;
    document
        .select(&selector)
        .next()
        .and_then(|el| el.value().attr("content"))
        .map(|s| s.trim().to_string())
}

fn extract_main_text(document: &Html) -> String {
    // Try to find main content area
    let content_selectors = [
        "main",
        "article",
        "[role='main']",
        ".main-content",
        "#main-content",
        ".content",
        "#content",
    ];

    for selector_str in content_selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            if let Some(element) = document.select(&selector).next() {
                let text = extract_text_from_element(&element);
                if text.len() > 200 {
                    return text;
                }
            }
        }
    }

    // Fall back to body
    let body_selector = Selector::parse("body").unwrap();
    document
        .select(&body_selector)
        .next()
        .map(|el| extract_text_from_element(&el))
        .unwrap_or_default()
}

fn extract_text_from_element(element: &scraper::ElementRef) -> String {
    let mut text = String::new();

    for node in element.text() {
        let trimmed = node.trim();
        if !trimmed.is_empty() {
            if !text.is_empty() {
                text.push(' ');
            }
            text.push_str(trimmed);
        }
    }

    // Limit text length
    if text.len() > 10000 {
        text.truncate(10000);
        text.push_str("...");
    }

    text
}

fn detect_page_type(document: &Html, url: &str) -> PageType {
    let url_lower = url.to_lowercase();

    // Check URL patterns
    if url_lower.contains("/product")
        || url_lower.contains("/dp/")
        || url_lower.contains("/item/")
        || url_lower.contains("/p/")
    {
        return PageType::Product;
    }

    if url_lower.contains("/article")
        || url_lower.contains("/blog")
        || url_lower.contains("/post")
        || url_lower.contains("/news")
    {
        return PageType::Article;
    }

    if url_lower.contains("/search") || url_lower.contains("?q=") || url_lower.contains("?query=")
    {
        return PageType::Search;
    }

    // Check for product schema
    let product_schema_selector = Selector::parse("[itemtype*='Product']").ok();
    if let Some(selector) = product_schema_selector {
        if document.select(&selector).next().is_some() {
            return PageType::Product;
        }
    }

    // Check for article schema
    let article_schema_selector = Selector::parse("[itemtype*='Article']").ok();
    if let Some(selector) = article_schema_selector {
        if document.select(&selector).next().is_some() {
            return PageType::Article;
        }
    }

    // Check for price elements (indicating product page)
    let price_selectors = [".price", "[class*='price']", "[data-price]"];
    for selector_str in price_selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            if document.select(&selector).next().is_some() {
                return PageType::Product;
            }
        }
    }

    PageType::Other
}

fn extract_product_info(document: &Html) -> Option<ProductInfo> {
    let name = extract_product_name(document)?;
    let price = extract_price(document);
    let images = extract_product_images(document);

    Some(ProductInfo {
        name,
        price,
        currency: "USD".to_string(),
        images,
        description: extract_product_description(document),
        rating: extract_rating(document),
        review_count: extract_review_count(document),
        availability: extract_availability(document),
        brand: extract_brand(document),
        category: "".to_string(),
    })
}

fn extract_product_name(document: &Html) -> Option<String> {
    let selectors = [
        "[itemprop='name']",
        "h1.product-title",
        "h1.product-name",
        "h1[data-product-name]",
        ".product-title h1",
        "#productTitle",
        "h1",
    ];

    for selector_str in selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            if let Some(element) = document.select(&selector).next() {
                let text = element.text().collect::<String>().trim().to_string();
                if !text.is_empty() && text.len() < 500 {
                    return Some(text);
                }
            }
        }
    }

    None
}

fn extract_price(document: &Html) -> Option<f64> {
    let selectors = [
        "[itemprop='price']",
        ".price",
        ".product-price",
        "#priceblock_ourprice",
        "[data-price]",
    ];

    for selector_str in selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            if let Some(element) = document.select(&selector).next() {
                // Try data-price attribute first
                if let Some(price_attr) = element.value().attr("data-price") {
                    if let Ok(price) = price_attr.parse::<f64>() {
                        return Some(price);
                    }
                }

                // Try to parse from text
                let text = element.text().collect::<String>();
                if let Some(price) = parse_price_from_text(&text) {
                    return Some(price);
                }
            }
        }
    }

    None
}

fn parse_price_from_text(text: &str) -> Option<f64> {
    let cleaned: String = text
        .chars()
        .filter(|c| c.is_ascii_digit() || *c == '.' || *c == ',')
        .collect();

    // Handle European format (1.234,56) vs US format (1,234.56)
    let normalized = if cleaned.contains(',') && cleaned.contains('.') {
        if cleaned.rfind(',') > cleaned.rfind('.') {
            cleaned.replace('.', "").replace(',', ".")
        } else {
            cleaned.replace(',', "")
        }
    } else if cleaned.contains(',') {
        cleaned.replace(',', ".")
    } else {
        cleaned
    };

    normalized.parse::<f64>().ok()
}

fn extract_product_images(document: &Html) -> Vec<String> {
    let mut images = Vec::new();

    let selectors = [
        "[itemprop='image']",
        ".product-image img",
        "#product-image img",
        ".gallery img",
    ];

    for selector_str in selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            for element in document.select(&selector) {
                if let Some(src) = element.value().attr("src").or(element.value().attr("data-src"))
                {
                    if !src.is_empty() && !images.contains(&src.to_string()) {
                        images.push(src.to_string());
                    }
                }
            }
        }
    }

    images.truncate(5);
    images
}

fn extract_product_description(document: &Html) -> String {
    let selectors = [
        "[itemprop='description']",
        ".product-description",
        "#product-description",
        "#feature-bullets",
    ];

    for selector_str in selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            if let Some(element) = document.select(&selector).next() {
                let text = element.text().collect::<String>().trim().to_string();
                if !text.is_empty() {
                    return text;
                }
            }
        }
    }

    String::new()
}

fn extract_rating(document: &Html) -> Option<f64> {
    let selectors = ["[itemprop='ratingValue']", ".rating", ".star-rating"];

    for selector_str in selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            if let Some(element) = document.select(&selector).next() {
                if let Some(content) = element.value().attr("content") {
                    if let Ok(rating) = content.parse::<f64>() {
                        return Some(rating);
                    }
                }

                let text = element.text().collect::<String>();
                if let Ok(rating) = text.trim().parse::<f64>() {
                    return Some(rating);
                }
            }
        }
    }

    None
}

fn extract_review_count(document: &Html) -> Option<i32> {
    let selectors = ["[itemprop='reviewCount']", ".review-count", "#reviewCount"];

    for selector_str in selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            if let Some(element) = document.select(&selector).next() {
                if let Some(content) = element.value().attr("content") {
                    if let Ok(count) = content.parse::<i32>() {
                        return Some(count);
                    }
                }

                let text: String = element
                    .text()
                    .collect::<String>()
                    .chars()
                    .filter(|c| c.is_ascii_digit())
                    .collect();

                if let Ok(count) = text.parse::<i32>() {
                    return Some(count);
                }
            }
        }
    }

    None
}

fn extract_availability(document: &Html) -> String {
    let selectors = ["[itemprop='availability']", ".availability", "#availability"];

    for selector_str in selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            if let Some(element) = document.select(&selector).next() {
                let text = element.text().collect::<String>().trim().to_string();
                if !text.is_empty() {
                    return text;
                }
            }
        }
    }

    "Unknown".to_string()
}

fn extract_brand(document: &Html) -> String {
    let selectors = ["[itemprop='brand']", ".brand", "#brand"];

    for selector_str in selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            if let Some(element) = document.select(&selector).next() {
                let text = element.text().collect::<String>().trim().to_string();
                if !text.is_empty() {
                    return text;
                }
            }
        }
    }

    String::new()
}

fn extract_article_info(document: &Html) -> Option<ArticleInfo> {
    let author = extract_author(document);
    let publish_date = extract_publish_date(document);
    let reading_time = estimate_reading_time(document);

    if author.is_empty() && publish_date.is_empty() {
        return None;
    }

    Some(ArticleInfo {
        author,
        publish_date,
        reading_time,
    })
}

fn extract_author(document: &Html) -> String {
    let selectors = ["[itemprop='author']", ".author", ".byline", "[rel='author']"];

    for selector_str in selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            if let Some(element) = document.select(&selector).next() {
                let text = element.text().collect::<String>().trim().to_string();
                if !text.is_empty() {
                    return text;
                }
            }
        }
    }

    String::new()
}

fn extract_publish_date(document: &Html) -> String {
    let selectors = [
        "[itemprop='datePublished']",
        "time[datetime]",
        ".publish-date",
        ".date",
    ];

    for selector_str in selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            if let Some(element) = document.select(&selector).next() {
                if let Some(datetime) = element.value().attr("datetime") {
                    return datetime.to_string();
                }

                let text = element.text().collect::<String>().trim().to_string();
                if !text.is_empty() {
                    return text;
                }
            }
        }
    }

    String::new()
}

fn estimate_reading_time(document: &Html) -> i32 {
    let text = extract_main_text(document);
    let word_count = text.split_whitespace().count();
    let reading_speed = 200; // words per minute

    ((word_count as f64 / reading_speed as f64).ceil() as i32).max(1)
}
