import Link from 'next/link';

export default function Home() {
  const highlights = [
    { title: 'Trusted Car Experts', desc: 'Certified fleet checks before every ride', icon: '01' },
    { title: 'Premium Response', desc: 'Fast booking support with real-time updates', icon: '02' },
    { title: 'Clean, Safe, Powerful', desc: 'Luxury-level interior care and safety flow', icon: '03' },
  ];

  const services = [
    'Car Rental',
    'Events and Club',
    'Garage and Repair',
    '24/7 Premium Assistance',
  ];

  const gallery = [
    {
      name: 'Sunset Tourer',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Urban Carbon',
      image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Night Runner',
      image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Apex',
      image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Velocity R',
      image: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Glacier',
      image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  const sideCards = [
    {
      name: 'Sports Line',
      image: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Executive Ride',
      image: 'https://images.unsplash.com/photo-1617654112368-307921291f42?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-[1120px] px-3 py-4 sm:px-6 lg:px-1">
        <section className="scan-lines glass-panel fade-rise overflow-hidden rounded-3xl p-3 sm:p-5">
          <nav className="mb-6 flex items-center justify-between gap-3 border-b border-[#18516d]/60 pb-4 text-[11px] uppercase tracking-[0.2em] text-[#79a9bf] sm:text-xs">
            <span className="rounded-full border border-[#2e8fb4] px-3 py-1 font-semibold text-[#c8f2ff]">Drivana</span>
            <div className="hidden gap-6 sm:flex">
              <a href="#about" className="hover:text-[#d7f5ff]">About</a>
              <a href="#fleet" className="hover:text-[#d7f5ff]">Fleet</a>
              <a href="#services" className="hover:text-[#d7f5ff]">Services</a>
              <a href="#contact" className="hover:text-[#d7f5ff]">Contact</a>
            </div>
            <Link href="/login" className="rounded-full border border-[#276f8e] bg-[#0b2433] px-4 py-1.5 text-[#c5effc] hover:bg-[#12354a]">
              Login
            </Link>
          </nav>

          <div className="grid gap-4 lg:grid-cols-[1.62fr_0.88fr]">
            <div
              className="relative overflow-hidden rounded-2xl border border-[#1d5a78] p-6 sm:p-8"
              style={{
                backgroundImage:
                  'linear-gradient(112deg, rgba(7,19,31,0.92) 10%, rgba(7,19,31,0.42) 50%, rgba(7,19,31,0.92) 100%), url(https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80)',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
              }}
            >
              <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[#2ec5f5]/20 blur-3xl" />
              <div className="absolute -right-24 -bottom-20 h-64 w-64 rounded-full bg-[#49e2d2]/10 blur-3xl" />
              <p className="relative mb-3 text-xs uppercase tracking-[0.25em] text-[#7db3c9]">Drivana Collection</p>
              <h1 className="relative text-4xl font-black uppercase leading-[0.88] tracking-tight text-[#e6fbff] sm:text-6xl">
                Drive Easy
              </h1>
              <p className="relative mt-5 max-w-xl text-sm text-[#9bc1d2] sm:text-base">
                Premium vehicles, trusted drivers, and smooth booking in one place. Built for city rides, events, and long distance comfort.
              </p>
              <div className="relative mt-6 flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-[0.18em] text-[#93c1d4]">
                <span>+450 Active Clients</span>
                <span className="h-1 w-1 rounded-full bg-[#3ecded]" />
                <span>98% Satisfaction</span>
              </div>
              <div className="relative mt-7 flex flex-wrap gap-3">
                <Link href="/register" className="pulse-ring rounded-full bg-[#2ec5f5] px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#042433] hover:bg-[#51d5ff]">
                  Reserve Now
                </Link>
                <a href="#fleet" className="rounded-full border border-[#2f7593] bg-[#0b2331]/70 px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#c8f2ff] hover:bg-[#113143]">
                  View Fleet
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {sideCards.map((item) => (
                <article key={item.name} className="glass-panel rounded-2xl p-3.5">
                  <div
                    className="h-28 rounded-xl border border-[#256780]"
                    style={{
                      backgroundImage:
                        `linear-gradient(180deg, rgba(5,12,20,0.2), rgba(5,12,20,0.8)), url(${item.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <h3 className="mt-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#d8f6ff]">{item.name}</h3>
                  <p className="mt-1 text-xs text-[#7ea7ba]">Performance and comfort balanced for every route.</p>
                </article>
              ))}
            </div>
          </div>

          <div id="about" className="mt-4 grid gap-3 border-t border-[#1b4f66]/70 pt-4 sm:grid-cols-3">
            {highlights.map((item) => (
              <article key={item.title} className="glass-panel rounded-xl p-3.5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#6fa7bf]">{item.icon} Feature</p>
                <h3 className="mt-2 text-sm font-semibold uppercase tracking-[0.11em] text-[#d8f5ff]">{item.title}</h3>
                <p className="mt-2 text-xs leading-5 text-[#7fa7bb]">{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="scan-lines glass-panel overflow-hidden rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#7ab5cb]">At Drivana</p>
            <h2 className="mt-3 max-w-xl text-2xl font-extrabold uppercase leading-tight text-[#e5faff] sm:text-3xl">
              We make driving simple whether you need a car, a driver, or both.
            </h2>
            <div
              className="mt-6 h-52 rounded-2xl border border-[#1f5874]"
              style={{
                backgroundImage:
                  'linear-gradient(180deg, rgba(7,16,24,0.2), rgba(7,16,24,0.9)), url(https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </article>

          <article id="services" className="glass-panel rounded-3xl p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[#7ab5cb]">Our Services</p>
            <ul className="mt-4 space-y-3">
              {services.map((service, idx) => (
                <li key={service} className="rounded-xl border border-[#1b4f68] bg-[#0a1e2b]/70 p-3 transition hover:border-[#2e87ab]">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#71a8bf]">{String(idx + 1).padStart(2, '0')}</span>
                  <p className="mt-1 text-sm uppercase tracking-[0.12em] text-[#d5f4ff]">{service}</p>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section id="fleet" className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#7ab5cb]">Discover</p>
              <h2 className="mt-2 text-xl font-extrabold uppercase tracking-[0.06em] text-[#e5faff] sm:text-2xl">Our Exclusive Car Collection</h2>
            </div>
            <a href="#contact" className="rounded-full border border-[#2d7390] px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-[#c5effc] hover:bg-[#0f2c3d]">
              Contact Sales
            </a>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((car, i) => (
              <article key={car.name} className="glass-panel group overflow-hidden rounded-2xl p-3">
                <div
                  className="h-36 rounded-xl border border-[#225a73] transition duration-300 group-hover:scale-[1.02]"
                  style={{
                    backgroundImage:
                      `linear-gradient(180deg, rgba(6,15,23,0.25), rgba(6,15,23,0.8)), url(${car.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="mt-2.5 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#dcf7ff]">{car.name}</h3>
                  <span className="text-[11px] uppercase tracking-[0.15em] text-[#76a9bf]">#{i + 1}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="mt-10 grid gap-4 pb-10 lg:grid-cols-[1.05fr_0.95fr]">
          <article
            className="glass-panel rounded-3xl p-6"
            style={{
              backgroundImage:
                'linear-gradient(140deg, rgba(4,14,23,0.88), rgba(4,14,23,0.5)), url(https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1200&q=80)',
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          >
            <p className="text-xs uppercase tracking-[0.22em] text-[#7ab5cb]">Need Help?</p>
            <h2 className="mt-2 text-2xl font-extrabold uppercase text-[#e4f9ff]">Get Questions? We are ready to help.</h2>
            <p className="mt-4 text-sm leading-6 text-[#86aec1]">
              Reach us for rental plans, private events, and chauffeur support. Our team answers quickly and guides every booking step.
            </p>
          </article>

          <article className="glass-panel rounded-3xl p-5">
            <form className="grid gap-3">
              <input placeholder="Full Name" className="rounded-lg border border-[#255f7a] bg-[#071826] px-3 py-2 text-sm text-[#d8f6ff] outline-none placeholder:text-[#62889c] focus:border-[#3ba4cc]" />
              <input placeholder="Email Address" className="rounded-lg border border-[#255f7a] bg-[#071826] px-3 py-2 text-sm text-[#d8f6ff] outline-none placeholder:text-[#62889c] focus:border-[#3ba4cc]" />
              <textarea placeholder="How can we help?" rows={4} className="rounded-lg border border-[#255f7a] bg-[#071826] px-3 py-2 text-sm text-[#d8f6ff] outline-none placeholder:text-[#62889c] focus:border-[#3ba4cc]" />
              <button type="button" className="mt-1 rounded-lg bg-[#2ec5f5] py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#042333] hover:bg-[#59d9ff]">
                Send Message
              </button>
            </form>
          </article>
        </section>

        <footer className="mt-2 border-t border-[#184a62] py-5 text-center text-xs uppercase tracking-[0.15em] text-[#6f9ab0]">
          Drivana Mobility Collection
        </footer>
      </main>
    </div>
  )
}
