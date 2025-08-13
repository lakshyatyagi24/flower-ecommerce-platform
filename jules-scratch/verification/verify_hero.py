from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000", wait_until="networkidle")

        # Target the hero section specifically for the screenshot
        hero_section = page.locator('section[aria-label="Homepage Hero"]')

        # Find the "Plan an Event" button
        plan_event_button = page.get_by_role("link", name="Plan An Event")

        # Hover over the button
        plan_event_button.hover()

        # Give animations a moment to settle
        page.wait_for_timeout(500) # 500ms should be enough for the hover effect

        hero_section.screenshot(path="verification_hover.png")
        browser.close()

if __name__ == "__main__":
    run()
