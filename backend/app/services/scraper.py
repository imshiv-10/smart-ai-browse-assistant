import re
import asyncio
from typing import Optional
from urllib.parse import quote_plus
from playwright.async_api import async_playwright, Page, Browser
from bs4 import BeautifulSoup

from ..config import get_settings
from ..models import ProductAlternative

settings = get_settings()


class ScraperService:
    """Service for scraping product information from the web."""

    def __init__(self):
        self.headless = settings.scraper_headless
        self.timeout = settings.scraper_timeout
        self.max_pages = settings.scraper_max_pages

    async def _get_browser(self) -> Browser:
        """Get a Playwright browser instance."""
        playwright = await async_playwright().start()
        browser = await playwright.chromium.launch(
            headless=self.headless,
            args=["--no-sandbox", "--disable-setuid-sandbox"],
        )
        return browser

    async def search_product_alternatives(
        self,
        query: str,
        current_product_name: str,
        max_results: int = 5,
    ) -> list[ProductAlternative]:
        """
        Search for product alternatives across multiple sources.

        Args:
            query: Search query for finding alternatives
            current_product_name: Name of the current product (to exclude)
            max_results: Maximum number of alternatives to return

        Returns:
            List of alternative products found
        """
        alternatives: list[ProductAlternative] = []

        try:
            browser = await self._get_browser()

            # Search multiple sources in parallel
            tasks = [
                self._search_google_shopping(browser, query, current_product_name),
                self._search_amazon(browser, query, current_product_name),
            ]

            results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in results:
                if isinstance(result, list):
                    alternatives.extend(result)

            await browser.close()

        except Exception as e:
            print(f"Scraping error: {e}")

        # Remove duplicates and limit results
        seen_names = set()
        unique_alternatives = []
        for alt in alternatives:
            name_lower = alt.name.lower()
            if name_lower not in seen_names and current_product_name.lower() not in name_lower:
                seen_names.add(name_lower)
                unique_alternatives.append(alt)

        return unique_alternatives[:max_results]

    async def _search_google_shopping(
        self,
        browser: Browser,
        query: str,
        exclude_name: str,
    ) -> list[ProductAlternative]:
        """Search Google Shopping for alternatives."""
        alternatives = []

        try:
            page = await browser.new_page()
            await page.set_viewport_size({"width": 1280, "height": 800})

            # Navigate to Google Shopping
            search_url = f"https://www.google.com/search?q={quote_plus(query)}&tbm=shop"
            await page.goto(search_url, timeout=self.timeout)

            # Wait for results
            await page.wait_for_selector(".sh-dgr__grid-result", timeout=10000)

            # Get page content
            html = await page.content()
            soup = BeautifulSoup(html, "html.parser")

            # Parse product cards
            products = soup.select(".sh-dgr__grid-result")[:5]

            for product in products:
                try:
                    # Extract name
                    name_elem = product.select_one("h3, .tAxDx")
                    name = name_elem.get_text(strip=True) if name_elem else None

                    if not name or exclude_name.lower() in name.lower():
                        continue

                    # Extract price
                    price_elem = product.select_one(".a8Pemb, .kHxwFf")
                    price_text = price_elem.get_text(strip=True) if price_elem else ""
                    price = self._parse_price(price_text)

                    # Extract image
                    img_elem = product.select_one("img")
                    image = img_elem.get("src") if img_elem else None

                    # Extract link
                    link_elem = product.select_one("a")
                    url = link_elem.get("href", "") if link_elem else ""
                    if url.startswith("/"):
                        url = f"https://www.google.com{url}"

                    # Extract rating
                    rating_elem = product.select_one(".Rsc7Yb")
                    rating = None
                    if rating_elem:
                        rating_text = rating_elem.get_text(strip=True)
                        rating_match = re.search(r"(\d+\.?\d*)", rating_text)
                        if rating_match:
                            rating = float(rating_match.group(1))

                    alternatives.append(
                        ProductAlternative(
                            name=name,
                            price=price,
                            currency="USD",
                            url=url,
                            image=image,
                            rating=rating,
                            source="Google Shopping",
                        )
                    )

                except Exception:
                    continue

            await page.close()

        except Exception as e:
            print(f"Google Shopping search error: {e}")

        return alternatives

    async def _search_amazon(
        self,
        browser: Browser,
        query: str,
        exclude_name: str,
    ) -> list[ProductAlternative]:
        """Search Amazon for alternatives."""
        alternatives = []

        try:
            page = await browser.new_page()
            await page.set_viewport_size({"width": 1280, "height": 800})

            # Navigate to Amazon search
            search_url = f"https://www.amazon.com/s?k={quote_plus(query)}"
            await page.goto(search_url, timeout=self.timeout)

            # Wait for results
            await page.wait_for_selector('[data-component-type="s-search-result"]', timeout=10000)

            # Get page content
            html = await page.content()
            soup = BeautifulSoup(html, "html.parser")

            # Parse product cards
            products = soup.select('[data-component-type="s-search-result"]')[:5]

            for product in products:
                try:
                    # Extract name
                    name_elem = product.select_one("h2 a span, .a-text-normal")
                    name = name_elem.get_text(strip=True) if name_elem else None

                    if not name or exclude_name.lower() in name.lower():
                        continue

                    # Extract price
                    price_elem = product.select_one(".a-price .a-offscreen")
                    price_text = price_elem.get_text(strip=True) if price_elem else ""
                    price = self._parse_price(price_text)

                    # Extract image
                    img_elem = product.select_one(".s-image")
                    image = img_elem.get("src") if img_elem else None

                    # Extract link
                    link_elem = product.select_one("h2 a")
                    href = link_elem.get("href", "") if link_elem else ""
                    url = f"https://www.amazon.com{href}" if href else ""

                    # Extract rating
                    rating_elem = product.select_one(".a-icon-star-small .a-icon-alt")
                    rating = None
                    if rating_elem:
                        rating_text = rating_elem.get_text(strip=True)
                        rating_match = re.search(r"(\d+\.?\d*)", rating_text)
                        if rating_match:
                            rating = float(rating_match.group(1))

                    alternatives.append(
                        ProductAlternative(
                            name=name[:100],  # Truncate long names
                            price=price,
                            currency="USD",
                            url=url,
                            image=image,
                            rating=rating,
                            source="Amazon",
                        )
                    )

                except Exception:
                    continue

            await page.close()

        except Exception as e:
            print(f"Amazon search error: {e}")

        return alternatives

    async def extract_page_content(self, url: str) -> dict:
        """
        Extract content from a URL.

        Args:
            url: URL to extract content from

        Returns:
            Dictionary with extracted content
        """
        try:
            browser = await self._get_browser()
            page = await browser.new_page()

            await page.goto(url, timeout=self.timeout)
            await page.wait_for_load_state("domcontentloaded")

            # Get page HTML
            html = await page.content()
            soup = BeautifulSoup(html, "html.parser")

            # Extract basic info
            title = await page.title()

            # Extract meta description
            meta_desc = soup.select_one('meta[name="description"]')
            description = meta_desc.get("content", "") if meta_desc else ""

            # Extract main text
            for tag in soup.select("script, style, nav, header, footer, aside"):
                tag.decompose()

            main = soup.select_one("main, article, .content, #content")
            text = main.get_text(" ", strip=True) if main else soup.body.get_text(" ", strip=True)

            await page.close()
            await browser.close()

            return {
                "url": url,
                "title": title,
                "description": description,
                "text": text[:50000],
            }

        except Exception as e:
            print(f"Page extraction error: {e}")
            return {"url": url, "title": "", "description": "", "text": ""}

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
