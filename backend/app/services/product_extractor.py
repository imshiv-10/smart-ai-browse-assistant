import re
from typing import Optional
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, Browser

from ..config import get_settings
from ..models import ProductInfo

settings = get_settings()


class ProductExtractorService:
    """Service for extracting product information from web pages."""

    def __init__(self):
        self.timeout = settings.scraper_timeout
        self.headless = settings.scraper_headless

    async def extract_from_url(self, url: str) -> Optional[ProductInfo]:
        """
        Extract product information from a URL.

        Args:
            url: Product page URL

        Returns:
            ProductInfo if extraction successful, None otherwise
        """
        try:
            playwright = await async_playwright().start()
            browser = await playwright.chromium.launch(headless=self.headless)
            page = await browser.new_page()

            await page.goto(url, timeout=self.timeout)
            await page.wait_for_load_state("domcontentloaded")

            html = await page.content()
            await browser.close()

            return self._parse_product_html(html, url)

        except Exception as e:
            print(f"Product extraction error: {e}")
            return None

    def _parse_product_html(self, html: str, url: str) -> Optional[ProductInfo]:
        """Parse product information from HTML."""
        soup = BeautifulSoup(html, "html.parser")

        # Determine site type and use appropriate parser
        if "amazon" in url.lower():
            return self._parse_amazon(soup)
        elif "ebay" in url.lower():
            return self._parse_ebay(soup)
        else:
            return self._parse_generic(soup)

    def _parse_amazon(self, soup: BeautifulSoup) -> Optional[ProductInfo]:
        """Parse Amazon product page."""
        try:
            # Name
            name_elem = soup.select_one("#productTitle")
            name = name_elem.get_text(strip=True) if name_elem else "Unknown"

            # Price
            price = None
            price_elem = soup.select_one(".a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice")
            if price_elem:
                price = self._parse_price(price_elem.get_text(strip=True))

            # Rating
            rating = None
            rating_elem = soup.select_one("#acrPopover, .a-icon-star")
            if rating_elem:
                rating_text = rating_elem.get("title", "") or rating_elem.get_text()
                match = re.search(r"(\d+\.?\d*)", rating_text)
                if match:
                    rating = float(match.group(1))

            # Review count
            review_count = None
            review_elem = soup.select_one("#acrCustomerReviewText")
            if review_elem:
                match = re.search(r"([\d,]+)", review_elem.get_text())
                if match:
                    review_count = int(match.group(1).replace(",", ""))

            # Brand
            brand = ""
            brand_elem = soup.select_one("#bylineInfo, .po-brand .a-span9")
            if brand_elem:
                brand = brand_elem.get_text(strip=True).replace("Visit the ", "").replace(" Store", "")

            # Images
            images = []
            for img in soup.select("#imgTagWrapperId img, #landingImage"):
                src = img.get("src") or img.get("data-old-hires")
                if src:
                    images.append(src)

            # Description
            description = ""
            desc_elem = soup.select_one("#productDescription, #feature-bullets")
            if desc_elem:
                description = desc_elem.get_text(" ", strip=True)[:2000]

            # Availability
            availability = "unknown"
            avail_elem = soup.select_one("#availability")
            if avail_elem:
                avail_text = avail_elem.get_text().lower()
                if "in stock" in avail_text:
                    availability = "in_stock"
                elif "out of stock" in avail_text:
                    availability = "out_of_stock"

            return ProductInfo(
                name=name,
                price=price,
                currency="USD",
                images=images[:5],
                description=description,
                rating=rating,
                review_count=review_count,
                availability=availability,
                brand=brand,
                category="",
            )

        except Exception as e:
            print(f"Amazon parsing error: {e}")
            return None

    def _parse_ebay(self, soup: BeautifulSoup) -> Optional[ProductInfo]:
        """Parse eBay product page."""
        try:
            # Name
            name_elem = soup.select_one("h1.x-item-title__mainTitle")
            name = name_elem.get_text(strip=True) if name_elem else "Unknown"

            # Price
            price = None
            price_elem = soup.select_one(".x-price-primary .ux-textspans")
            if price_elem:
                price = self._parse_price(price_elem.get_text(strip=True))

            # Images
            images = []
            for img in soup.select(".ux-image-carousel-item img"):
                src = img.get("src")
                if src:
                    images.append(src)

            return ProductInfo(
                name=name,
                price=price,
                currency="USD",
                images=images[:5],
                description="",
                rating=None,
                review_count=None,
                availability="unknown",
                brand="",
                category="",
            )

        except Exception as e:
            print(f"eBay parsing error: {e}")
            return None

    def _parse_generic(self, soup: BeautifulSoup) -> Optional[ProductInfo]:
        """Parse generic product page using schema.org markup."""
        try:
            # Try to find schema.org Product markup
            product_schema = soup.select_one('[itemtype*="schema.org/Product"]')

            if product_schema:
                name_elem = product_schema.select_one('[itemprop="name"]')
                price_elem = product_schema.select_one('[itemprop="price"]')
                image_elem = product_schema.select_one('[itemprop="image"]')
                desc_elem = product_schema.select_one('[itemprop="description"]')
                rating_elem = product_schema.select_one('[itemprop="ratingValue"]')
                brand_elem = product_schema.select_one('[itemprop="brand"]')

                name = name_elem.get_text(strip=True) if name_elem else "Unknown"
                price = None
                if price_elem:
                    price_content = price_elem.get("content") or price_elem.get_text()
                    price = self._parse_price(price_content)

                images = []
                if image_elem:
                    src = image_elem.get("src") or image_elem.get("content")
                    if src:
                        images.append(src)

                description = desc_elem.get_text(strip=True)[:2000] if desc_elem else ""

                rating = None
                if rating_elem:
                    rating_content = rating_elem.get("content") or rating_elem.get_text()
                    match = re.search(r"(\d+\.?\d*)", rating_content)
                    if match:
                        rating = float(match.group(1))

                brand = ""
                if brand_elem:
                    brand = brand_elem.get_text(strip=True)

                return ProductInfo(
                    name=name,
                    price=price,
                    currency="USD",
                    images=images,
                    description=description,
                    rating=rating,
                    review_count=None,
                    availability="unknown",
                    brand=brand,
                    category="",
                )

            # Fallback to generic extraction
            name_elem = soup.select_one("h1, .product-title, .product-name")
            name = name_elem.get_text(strip=True) if name_elem else "Unknown Product"

            price_elem = soup.select_one(".price, .product-price, [class*='price']")
            price = None
            if price_elem:
                price = self._parse_price(price_elem.get_text())

            return ProductInfo(
                name=name,
                price=price,
                currency="USD",
                images=[],
                description="",
                rating=None,
                review_count=None,
                availability="unknown",
                brand="",
                category="",
            )

        except Exception as e:
            print(f"Generic parsing error: {e}")
            return None

    def _parse_price(self, price_text: str) -> Optional[float]:
        """Parse price from text."""
        if not price_text:
            return None

        # Remove currency symbols and extract number
        match = re.search(r"[\d,]+\.?\d*", price_text.replace(",", ""))
        if match:
            try:
                return float(match.group())
            except ValueError:
                pass

        return None
