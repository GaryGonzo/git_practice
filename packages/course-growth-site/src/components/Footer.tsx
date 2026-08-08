import { Link } from "react-router-dom";
import { Container } from "./ui";

export function Footer() {
  return (
    <footer className="border-t border-fairway-dark/20 bg-fairway-dark text-cream/70">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <div className="font-display text-lg text-cream">OGG Course Growth</div>
            <div className="mt-1 text-xs uppercase tracking-[0.16em] text-cream/50">
              A division of Oregon Golf Guide
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Helping Oregon's golf courses grow — done-for-you revenue marketing for the golfers
              and traffic you already have.
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-cream/50">
              The Offer
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/how-it-works" className="hover:text-cream">How It Works</Link></li>
              <li><Link to="/buildout" className="hover:text-cream">6-Week Buildout</Link></li>
              <li><Link to="/whats-included" className="hover:text-cream">What's Included</Link></li>
              <li><Link to="/guarantee" className="hover:text-cream">Guarantee</Link></li>
              <li><Link to="/results" className="hover:text-cream">Results</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-cream/50">
              Company
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-cream">About</Link></li>
              <li><Link to="/faq" className="hover:text-cream">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-cream">Contact</Link></li>
              <li><Link to="/apply" className="hover:text-cream">Apply for a Call</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-cream/10 pt-6 text-xs text-cream/40 sm:flex-row sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} Oregon Golf Guide — Course Growth. All rights reserved.</div>
          <div>Serving golf courses across Oregon and the Pacific Northwest.</div>
        </div>
      </Container>
    </footer>
  );
}
