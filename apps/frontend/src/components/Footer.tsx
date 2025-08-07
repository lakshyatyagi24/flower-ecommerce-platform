export default function Footer() {
  return (
    <footer className="footer mt-20 border-t border-olive-200 py-8 text-center text-primary bg-beige">
      <div className="flex justify-center items-center gap-12 mb-2 text-sm">
        <a href="/contact" className="hover:underline">
          Contact Us
        </a>
        <a href="/faq" className="hover:underline">
          FAQ
        </a>
        <a href="/privacy" className="hover:underline">
          Privacy Policy
        </a>
      </div>
      <div className="text-xs">&copy; 2024 Petal & Twine. All rights reserved.</div>
    </footer>
  );
}
