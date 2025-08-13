from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000", wait_until="networkidle")

        # Target the hero section specifically for the screenshot
        hero_section = page.locator('section[aria-label="Homepage Hero"]')

        # Before taking a screenshot, it's good practice to ensure the element is stable.
        # For example, wait for an animation to complete if necessary.
        # In this case, we'll just ensure the main heading is visible.
        h1 = hero_section.locator('h1')
        expect(h1).to_be_visible(timeout=15000) # 15s timeout

        # Give animations a moment to settle
        page.wait_for_timeout(1000)

        hero_section.screenshot(path="jules-scratch/verification/verification.png")
        browser.close()

if __name__ == "__main__":
    run()
