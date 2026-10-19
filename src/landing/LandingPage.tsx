import "./landing.css";
import Nav from "./components/Nav";
import HeroOrbit from "./components/HeroOrbit";
import RacingLine from "./components/RacingLine";
import ScrollRace from "./components/ScrollRace";
import TimingBoard from "./components/TimingBoard";
import TelemetryWave from "./components/TelemetryWave";
import DragBattle from "./components/DragBattle";
import DotField from "./components/DotField";
import TrackMorph from "./components/TrackMorph";
import LightsOut from "./components/LightsOut";
import DashboardReveal from "./components/DashboardReveal";
import FinalRace from "./components/FinalRace";
import ScrollRail from "./components/ScrollRail";
import Footer from "./components/Footer";

/**
 * LANDING PAGE → EXISTING DASHBOARD (#/dashboard).
 * A sequence of motion experiments. Zero dashboard logic lives here.
 */
export default function LandingPage() {
  return (
    <div className="lp-root min-h-screen">
      <a href="#main" className="lp-skip">Skip to content</a>
      <Nav />
      <ScrollRail />
      <main id="main">
        <HeroOrbit />
        <RacingLine />
        <ScrollRace />
        <TimingBoard />
        <TelemetryWave />
        <DragBattle />
        <DotField />
        <TrackMorph />
        <LightsOut />
        <DashboardReveal />
        <FinalRace />
      </main>
      <Footer />
    </div>
  );
}
