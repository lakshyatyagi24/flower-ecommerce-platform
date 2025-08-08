export default function InstagramFeed() {
  return (
    <section className="bg-beige/80 py-12 px-4 rounded-2xl max-w-5xl mx-auto mt-12 mb-8 border border-olive-200 shadow-lg">
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-brown-800 mb-4 text-center">
        Follow Us on Instagram
      </h2>
      <p className="text-center text-olive-dark mb-4">
        @yourhandle — For daily floral inspiration & rustic event magic
      </p>
      <div className="flex justify-center mb-6">
        {/* iframe below: replace src with your widget provider link! */}
        <iframe
          src="//lightwidget.com/widgets/e32584a1596050cf8e981d9ddba3349c.html"
          scrolling="no"
          allowTransparency={true}
          className="lightwidget-widget"
          style={{ width: '100%', border: 0, overflow: 'hidden' }}
        ></iframe>
      </div>
    </section>
  );
}
