import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const CommunityPage: React.FC = () => {
  useEffect(() => {
    // Fade-in on scroll logic
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { 
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const scrollToGroups = () => {
    document.getElementById('groups')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="community-page-wrapper">
      <style>{`
        :root {
          --green: #0B6E5F;
          --green-mid: #1A9B86;
          --green-light: #E4F5F1;
          --green-pale: #F0FAF7;
          --gold: #C8914A;
          --gold-light: #FDF6EC;
          --dark: #141C1A;
          --body: #2E3C38;
          --muted: #6B7C78;
          --border: #DCE8E4;
          --white: #FFFFFF;
          --bg: #F5FAF8;
          --wa: #25D366;
          --wa-dark: #128C7E;
        }

        .community-page-wrapper {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--body);
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          margin: 0;
          padding: 0;
          min-height: 100vh;
        }

        /* NAV */
        .comm-nav {
          background: var(--white);
          border-bottom: 1px solid var(--border);
          padding: 0 24px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .nav-logo {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--green);
          letter-spacing: -0.3px;
        }
        .nav-logo span { color: var(--gold); }
        .nav-links {
          display: flex;
          gap: 24px;
          list-style: none;
        }
        .nav-links a {
          font-size: 13px;
          color: var(--muted);
          text-decoration: none;
          transition: color .2s;
        }
        .nav-links a:hover, .nav-links a.active {
          color: var(--green);
          font-weight: 500;
        }

        /* HERO */
        .hero {
          background: var(--dark);
          padding: 64px 24px 56px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute;
          top: -80px;
          left: 50%;
          transform: translateX(-50%);
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: rgba(11, 110, 95, 0.12);
          pointer-events: none;
        }
        .hero::after {
          content: '';
          position: absolute;
          bottom: -60px;
          right: -40px;
          width: 240px;
          height: 240px;
          border-radius: 50%;
          background: rgba(200, 145, 74, 0.08);
          pointer-events: none;
        }
        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(26, 155, 134, 0.15);
          border: 1px solid rgba(26, 155, 134, 0.3);
          border-radius: 20px;
          padding: 5px 14px;
          font-size: 11px;
          color: #7ED6C8;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-bottom: 22px;
        }
        .hero-pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #1A9B86;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .5; transform: scale(1.3); }
        }
        .hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(28px, 5vw, 46px);
          font-weight: 600;
          color: #fff;
          line-height: 1.18;
          margin-bottom: 14px;
          position: relative;
        }
        .hero h1 em { color: #6ECDC0; font-style: normal; }
        .hero-sub {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.58);
          max-width: 460px;
          margin: 0 auto 32px;
          line-height: 1.75;
          position: relative;
        }
        .hero-stats {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-bottom: 36px;
          position: relative;
        }
        .stat-val {
          font-size: 26px;
          font-weight: 500;
          color: #fff;
          display: block;
        }
        .stat-lbl {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: .06em;
        }
        .hero-btns {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          position: relative;
        }

        /* BUTTONS */
        .btn-wa {
          background: var(--wa);
          color: #fff;
          border: none;
          padding: 13px 26px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          transition: all .2s;
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-wa:hover {
          background: var(--wa-dark);
          transform: translateY(-2px);
        }
        .btn-wa svg {
          width: 18px;
          height: 18px;
          fill: #fff;
          flex-shrink: 0;
        }
        .btn-outline {
          background: transparent;
          color: rgba(255, 255, 255, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 13px 26px;
          border-radius: 50px;
          font-size: 14px;
          cursor: pointer;
          transition: all .2s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-outline:hover {
          background: rgba(255, 255, 255, 0.07);
          color: #fff;
        }

        /* CRISIS STRIP */
        .crisis {
          background: var(--gold-light);
          border-top: 2px solid var(--gold);
          border-bottom: 1px solid #E8C07A;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          text-align: center;
        }
        .crisis-icon { font-size: 16px; }
        .crisis p { font-size: 13px; color: #7A4F0D; }
        .crisis strong { font-weight: 500; }
        .crisis a { color: var(--green); font-weight: 500; text-decoration: none; }

        /* SECTION COMMON */
        .section {
          padding: 52px 24px;
          max-width: 860px;
          margin: 0 auto;
        }
        .section-eyebrow {
          font-size: 11px;
          font-weight: 500;
          color: var(--green);
          text-transform: uppercase;
          letter-spacing: .1em;
          margin-bottom: 8px;
        }
        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(22px, 3vw, 30px);
          font-weight: 600;
          color: var(--dark);
          margin-bottom: 8px;
        }
        .section-desc {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.75;
          max-width: 520px;
          margin-bottom: 32px;
        }
        hr.section-sep {
          border: none;
          border-top: 1px solid var(--border);
          margin: 0;
        }

        /* HOW IT WORKS */
        .how-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }
        .how-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px 18px;
          position: relative;
          overflow: hidden;
          transition: border-color .2s;
        }
        .how-card:hover { border-color: var(--green-mid); }
        .how-card::before {
          content: attr(data-n);
          position: absolute;
          top: -6px;
          right: 10px;
          font-family: 'Playfair Display', serif;
          font-size: 52px;
          font-weight: 600;
          color: var(--green-light);
          line-height: 1;
        }
        .how-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: var(--green-light);
          color: var(--green);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          margin-bottom: 12px;
        }
        .how-card h3 {
          font-size: 13px;
          font-weight: 500;
          color: var(--dark);
          margin-bottom: 5px;
        }
        .how-card p {
          font-size: 12px;
          color: var(--muted);
          line-height: 1.6;
        }

        /* GROUPS */
        .groups-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
        }
        .group-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          cursor: pointer;
          transition: all .2s;
          text-decoration: none;
        }
        .group-card:hover {
          border-color: var(--green-mid);
          transform: translateY(-2px);
        }
        .group-card.crisis-card { border-left: 3px solid #E24B4A; }
        .group-card.crisis-card:hover { border-color: #E24B4A; }
        .group-emoji {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .group-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--dark);
          margin-bottom: 3px;
        }
        .group-desc {
          font-size: 12px;
          color: var(--muted);
          line-height: 1.55;
        }
        .group-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 20px;
          margin-top: 7px;
        }
        .badge-live { background: #FDE8E8; color: #A32D2D; }
        .badge-pro { background: var(--green-light); color: var(--green); }
        .badge-dot { width: 5px; height: 5px; border-radius: 50%; }

        /* JOIN CTA */
        .cta-section {
          background: var(--dark);
          border-radius: 20px;
          padding: 44px 32px;
          text-align: center;
          position: relative;
          overflow: hidden;
          margin: 0 24px 52px;
        }
        .cta-section::before {
          content: '';
          position: absolute;
          top: -50px;
          left: -50px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: rgba(11, 110, 95, 0.15);
        }
        .cta-section::after {
          content: '';
          position: absolute;
          bottom: -40px;
          right: -30px;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: rgba(200, 145, 74, 0.1);
        }
        .cta-section h2 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(20px, 3vw, 28px);
          color: #fff;
          margin-bottom: 10px;
          position: relative;
        }
        .cta-section p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.55);
          margin-bottom: 28px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
          position: relative;
        }
        .cta-section .btn-wa { position: relative; }

        /* FOOTER */
        .comm-footer {
          background: var(--dark);
          padding: 28px 24px;
          text-align: center;
        }
        .comm-footer p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.3);
          line-height: 1.8;
        }
        .comm-footer a { color: rgba(255, 255, 255, 0.5); text-decoration: none; }
        .comm-footer strong {
          font-family: 'Playfair Display', serif;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 400;
        }

        /* ANIMATIONS */
        .fade-up {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity .5s ease, transform .5s ease;
        }
        .fade-up.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* MOBILE */
        @media(max-width:600px){
          .hero{padding:48px 20px 44px}
          .hero-stats{gap:24px}
          .section{padding:40px 20px}
          .cta-section{margin:0 16px 40px;padding:32px 20px}
          .nav-links{display:none}
        }
      `}</style>

      {/* NAV */}
      <nav className="comm-nav">
        <div className="nav-logo">Humura<span>.</span>AI</div>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/community" className="active">Community</Link></li>
          <li><a href="#">About</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-pill"><span className="hero-pill-dot"></span> Community · Live now</div>
        <h1>You don't have to carry<br />this alone. <em>We're here.</em></h1>
        <p className="hero-sub">Join the Humura AI mental health community — a free, anonymous WhatsApp space supported by 10 verified professionals.</p>
        <div className="hero-stats">
          <div><span className="stat-val">10+</span><span className="stat-lbl">Professionals</span></div>
          <div><span className="stat-val">100%</span><span className="stat-lbl">Anonymous</span></div>
          <div><span className="stat-val">Free</span><span className="stat-lbl">Always</span></div>
        </div>
        <div className="hero-btns">
          <a className="btn-wa" href="https://chat.whatsapp.com/JY6lQTj2oH8KhRnzyvZiDK" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Join on WhatsApp
          </a>
          <button className="btn-outline" onClick={scrollToGroups}>View all groups ↓</button>
        </div>
      </section>

      {/* CRISIS STRIP */}
      <div className="crisis">
        <span className="crisis-icon">🚨</span>
        <p><strong>In crisis right now?</strong> Call Caraes Ndera Hospital immediately — <a href="tel:+250785843106">+250 785 843 106</a> · Available 24/7</p>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <section className="section fade-up">
          <div className="section-eyebrow">How it works</div>
          <div className="section-title">Simple, safe, and anonymous</div>
          <p className="section-desc">Your identity is fully protected at every step. Here is how to get support.</p>
          <div className="how-grid">
            <div className="how-card" data-n="1">
              <div className="how-icon">📩</div>
              <h3>Message our relay number</h3>
              <p>Send your message privately to the Humura AI number. Your real WhatsApp number stays hidden.</p>
            </div>
            <div className="how-card" data-n="2">
              <div className="how-icon">🎭</div>
              <h3>You get an anonymous alias</h3>
              <p>You are assigned a random alias like "HopeSeeker #23." No one in the community knows who you are.</p>
            </div>
            <div className="how-card" data-n="3">
              <div className="how-icon">💬</div>
              <h3>Your message reaches the right group</h3>
              <p>It appears in the right support group — anxiety, grief, depression — completely anonymously.</p>
            </div>
            <div className="how-card" data-n="4">
              <div className="how-icon">👩‍⚕️</div>
              <h3>A professional responds to you</h3>
              <p>A verified mental health professional replies directly to you within 24 hours. Crisis cases: 1 hour.</p>
            </div>
          </div>
        </section>
        <hr className="section-sep" />

        {/* GROUPS */}
        <section className="section fade-up" id="groups">
          <div className="section-eyebrow">Support groups</div>
          <div className="section-title">Find your space</div>
          <p className="section-desc">8 dedicated groups, each monitored by professionals in that specialty. Join the whole community and access all groups.</p>
          <div className="groups-grid">

            <a className="group-card" href="https://chat.whatsapp.com/JY6lQTj2oH8KhRnzyvZiDK" target="_blank" rel="noreferrer">
              <div className="group-emoji" style={{ background: '#E6F5F2' }}>📢</div>
              <div>
                <div className="group-name">Announcements</div>
                <div className="group-desc">Official updates, resources, and news from the Humura AI team. Read-only.</div>
                <span className="group-badge badge-pro"><span className="badge-dot" style={{ background: 'var(--green)' }}></span>Admin only</span>
              </div>
            </a>

            <a className="group-card" href="https://chat.whatsapp.com/JY6lQTj2oH8KhRnzyvZiDK" target="_blank" rel="noreferrer">
              <div className="group-emoji" style={{ background: '#E6F5F2' }}>💚</div>
              <div>
                <div className="group-name">General Support</div>
                <div className="group-desc">Share anything on your mind. Professionals and community members are here to listen.</div>
                <span className="group-badge badge-pro"><span className="badge-dot" style={{ background: 'var(--green)' }}></span>Professionals active</span>
              </div>
            </a>

            <a className="group-card" href="https://chat.whatsapp.com/JY6lQTj2oH8KhRnzyvZiDK" target="_blank" rel="noreferrer">
              <div className="group-emoji" style={{ background: '#EEF5FF' }}>🌬️</div>
              <div>
                <div className="group-name">Anxiety & Stress</div>
                <div className="group-desc">For members dealing with anxiety, panic attacks, overthinking, or daily stress.</div>
                <span className="group-badge badge-pro"><span className="badge-dot" style={{ background: 'var(--green)' }}></span>Professionals active</span>
              </div>
            </a>

            <a className="group-card" href="https://chat.whatsapp.com/JY6lQTj2oH8KhRnzyvZiDK" target="_blank" rel="noreferrer">
              <div className="group-emoji" style={{ background: '#F0EEFF' }}>🌤️</div>
              <div>
                <div className="group-name">Depression & Low Mood</div>
                <div className="group-desc">A gentle space for those experiencing sadness, emptiness, or depression. No pressure.</div>
                <span className="group-badge badge-pro"><span className="badge-dot" style={{ background: 'var(--green)' }}></span>Professionals active</span>
              </div>
            </a>

            <a className="group-card" href="https://chat.whatsapp.com/JY6lQTj2oH8KhRnzyvZiDK" target="_blank" rel="noreferrer">
              <div className="group-emoji" style={{ background: '#F5F0FF' }}>🕊️</div>
              <div>
                <div className="group-name">Grief & Loss</div>
                <div className="group-desc">For navigating loss of a loved one, a relationship, or any major life change.</div>
                <span className="group-badge badge-pro"><span className="badge-dot" style={{ background: 'var(--green)' }}></span>Grief therapist here</span>
              </div>
            </a>

            <a className="group-card" href="https://chat.whatsapp.com/JY6lQTj2oH8KhRnzyvZiDK" target="_blank" rel="noreferrer">
              <div className="group-emoji" style={{ background: '#FDF5EA' }}>🤝</div>
              <div>
                <div className="group-name">Relationships & Family</div>
                <div className="group-desc">Struggling with marriage, family conflict, or loneliness? Our counselors are here.</div>
                <span className="group-badge badge-pro"><span className="badge-dot" style={{ background: 'var(--green)' }}></span>Professionals active</span>
              </div>
            </a>

            <a className="group-card" href="https://chat.whatsapp.com/JY6lQTj2oH8KhRnzyvZiDK" target="_blank" rel="noreferrer">
              <div className="group-emoji" style={{ background: '#E6F5F2' }}>📚</div>
              <div>
                <div className="group-name">Resources & Wellness Tips</div>
                <div className="group-desc">Weekly mental health articles, breathing exercises, and coping tools from our team.</div>
                <span className="group-badge badge-pro"><span className="badge-dot" style={{ background: 'var(--green)' }}></span>Weekly updates</span>
              </div>
            </a>

            <a className="group-card crisis-card" href="https://chat.whatsapp.com/JY6lQTj2oH8KhRnzyvZiDK" target="_blank" rel="noreferrer">
              <div className="group-emoji" style={{ background: '#FDE8E8' }}>🚨</div>
              <div>
                <div className="group-name">Crisis Support</div>
                <div className="group-desc">For members in immediate distress. A crisis counselor responds within 1 hour, 24/7.</div>
                <span className="group-badge badge-live"><span className="badge-dot" style={{ background: '#E24B4A' }}></span>24/7 crisis counselor</span>
              </div>
            </a>

          </div>
        </section>
        <hr className="section-sep" />
      </div>

      {/* CTA */}
      <div className="cta-section fade-up">
        <h2>Ready to join? It takes 30 seconds.</h2>
        <p>Tap the button below, join the community, and you will have access to all 8 support groups and 10 professionals immediately.</p>
        <a className="btn-wa" href="https://chat.whatsapp.com/JY6lQTj2oH8KhRnzyvZiDK" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Join the Community on WhatsApp
        </a>
      </div>

      {/* FOOTER */}
      <footer className="comm-footer">
        <p><strong>Humura AI</strong> — Mental health support for everyone, everywhere.<br />
        This community provides peer and professional support. It is not a substitute for clinical treatment.<br />
        <a href="#">Privacy Policy</a> · <a href="#">Community Rules</a> · <a href="#">Contact Admin</a></p>
      </footer>
    </div>
  );
};

export default CommunityPage;
