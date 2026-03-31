import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
    // Check if user is already authenticated
    const hasToken = !!localStorage.getItem("token");

    // Reusable Feature Card Component
    const FeatureCard = ({ icon, title, description, delay }) => (
        <div className={`col-md-6 col-lg-3 mb-4`} style={{ animation: `fadeInUp 0.8s ease ${delay}s both` }}>
            <div className="glass-panel p-4 h-100 d-flex flex-column align-items-center text-center hover-glow transition-all" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="icon-wrapper mb-3 p-3 rounded-circle bg-dark bg-opacity-50 text-gradient shadow">
                    <i className={`bi ${icon}`} style={{ fontSize: '2rem' }}></i>
                </div>
                <h5 className="fw-bold text-white mb-3">{title}</h5>
                <p className="text-secondary small m-0">{description}</p>
            </div>
        </div>
    );

    return (
        <div className="landing-page position-relative overflow-hidden min-vh-100 bg-dark text-white">
            {/* Background Atmosphere Elements */}
            <div className="position-absolute rounded-circle blur-circle glow-purple" style={{ top: '-10%', left: '-5%', width: '40vw', height: '40vw', filter: 'blur(100px)', opacity: '0.15', zIndex: 0 }}></div>
            <div className="position-absolute rounded-circle blur-circle glow-blue" style={{ bottom: '-10%', right: '-5%', width: '35vw', height: '35vw', filter: 'blur(100px)', opacity: '0.15', background: 'radial-gradient(circle, rgba(0,212,255,1) 0%, rgba(9,9,121,0) 70%)', zIndex: 0 }}></div>

            {/* Minimal App Navbar specific for the landing storefront */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-transparent position-relative z-3 pt-4 px-4 px-md-5">
                <div className="container-fluid">
                    <span className="navbar-brand d-flex align-items-center fw-bold fs-4">
                        <i className="bi bi-mortarboard-fill me-2 text-warning" style={{ filter: 'drop-shadow(0px 0px 8px rgba(255, 193, 7, 0.6))' }}></i> 
                        <span className="text-white">Online</span><span className="text-warning">StudyRoom</span>
                    </span>
                    <div className="d-flex">
                        {hasToken ? (
                            <Link to="/dashboard" className="btn btn-outline-light rounded-pill px-4 fw-bold">Dashboard</Link>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-link text-white text-decoration-none fw-bold me-3">Login</Link>
                                <Link to="/signup" className="btn btn-premium rounded-pill px-4 shadow">Get Started</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Hero Section */}
            <div className="container position-relative z-3" style={{ marginTop: '10vh' }}>
                <div className="row justify-content-center text-center">
                    <div className="col-lg-9">
                        <div className="badge bg-dark border border-secondary border-opacity-50 rounded-pill px-3 py-2 mb-4 text-warning shadow-sm" style={{ animation: 'fadeInDown 0.8s ease' }}>
                            <i className="bi bi-rocket-takeoff me-2"></i> The Future of Collaborative Focus
                        </div>
                        <h1 className="display-2 fw-bolder mb-4" style={{ letterSpacing: '-1px', animation: 'fadeInUp 0.8s ease 0.1s both' }}>
                            Master Your Focus in an <br/>
                            <span className="text-gradient">Immersive Environment</span>
                        </h1>
                        <p className="lead text-secondary mb-5 px-md-5" style={{ fontSize: '1.25rem', animation: 'fadeInUp 0.8s ease 0.2s both' }}>
                            A deeply gamified, multiplayer platform engineered to actively prevent distractions. Level up your skills, collaborate in real-time, and dominate the global leaderboards.
                        </p>
                        <div className="d-flex justify-content-center gap-3" style={{ animation: 'fadeInUp 0.8s ease 0.3s both' }}>
                            {hasToken ? (
                                <Link to="/dashboard" className="btn btn-premium btn-lg rounded-pill px-5 shadow-lg d-flex align-items-center">
                                    Launch Dashboard <i className="bi bi-arrow-right-short ms-2 fs-4"></i>
                                </Link>
                            ) : (
                                <Link to="/signup" className="btn btn-premium btn-lg rounded-pill px-5 shadow-lg d-flex align-items-center">
                                    Start Achieving Today <i className="bi bi-lightning-charge-fill ms-2"></i>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dashboard Preview / Mockup Hero Image (Abstract Representation) */}
                <div className="row justify-content-center mt-5 pt-4" style={{ animation: 'fadeInUp 1s ease 0.5s both' }}>
                    <div className="col-10 text-center">
                        <div className="glass-panel p-3 rounded-4 shadow-lg border border-secondary border-opacity-25" style={{ background: 'linear-gradient(145deg, rgba(30,30,40,0.7) 0%, rgba(15,15,20,0.9) 100%)', transform: 'perspective(1000px) rotateX(5deg)' }}>
                            {/* Abstract mockup window */}
                            <div className="d-flex align-items-center border-bottom border-secondary border-opacity-25 pb-2 mb-3 px-2">
                                <div className="rounded-circle bg-danger me-2" style={{width: '12px', height: '12px'}}></div>
                                <div className="rounded-circle bg-warning me-2" style={{width: '12px', height: '12px'}}></div>
                                <div className="rounded-circle bg-success" style={{width: '12px', height: '12px'}}></div>
                                <div className="mx-auto text-secondary small fw-bold" style={{letterSpacing: '1px'}}>STUDYROOM_OS_1.0</div>
                            </div>
                            <div className="row g-3 p-2">
                                <div className="col-8">
                                    <div className="bg-dark bg-opacity-50 rounded-3 h-100 p-4 border border-secondary border-opacity-10 d-flex flex-column align-items-center justify-content-center text-secondary">
                                        <i className="bi bi-stopwatch-fill text-warning fs-1 mb-2 opacity-75"></i>
                                        <h4 className="fw-bolder text-white">25:00</h4>
                                        <small className="text-uppercase tracking-wide">Focus Session Active</small>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="row g-3 h-100">
                                        <div className="col-12">
                                            <div className="bg-gradient-primary rounded-3 h-100 p-3 shadow text-start">
                                                <small className="text-white text-opacity-75 fw-bold text-uppercase d-block mb-1">XP Gained</small>
                                                <h3 className="fw-bold text-white mb-0">+150 XP</h3>
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="bg-dark bg-opacity-50 rounded-3 h-100 p-3 border border-secondary border-opacity-10 text-start">
                                                <small className="text-secondary fw-bold text-uppercase d-block mb-1">Online</small>
                                                <div className="d-flex">
                                                    <div className="rounded-circle bg-success shadow-sm" style={{width:'24px', height:'24px', border: '2px solid #1e1e28'}}></div>
                                                    <div className="rounded-circle bg-primary shadow-sm" style={{width:'24px', height:'24px', border: '2px solid #1e1e28', marginLeft: '-10px'}}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="row mt-5 pt-5 pb-5 z-3 position-relative">
                    <div className="col-12 text-center mb-5">
                        <h2 className="fw-bold text-white">Engineered For <span className="text-warning"> Excellence</span></h2>
                    </div>

                    <FeatureCard 
                        icon="bi-shield-lock-fill text-danger text-opacity-75" 
                        title="Strict Focus Constraints" 
                        description="Intelligent tracking detects when you break focus by switching tabs. Cheating the timer pauses your session immediately." 
                        delay={0.1}
                    />
                    <FeatureCard 
                        icon="bi-controller text-info" 
                        title="RPG Progression System" 
                        description="Earn XP per fully focused minute. Rank up across academic fields, earn multipliers, and dominate global leaderboards." 
                        delay={0.2}
                    />
                    <FeatureCard 
                        icon="bi-people-fill text-primary" 
                        title="Real-Time Study Rooms" 
                        description="Share environments with peers utilizing synchronized Excalidraw whiteboards, live tasks, and presence monitoring." 
                        delay={0.3}
                    />
                    <FeatureCard 
                        icon="bi-journals text-success" 
                        title="In-App Document Viewer" 
                        description="Never leave the focus frame again. Open PDFs and upload resources directly within an encapsulated, distraction-free modal." 
                        delay={0.4}
                    />
                </div>
            </div>
            
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .glow-purple { background: radial-gradient(circle, rgba(124,58,237,0.4) 0%, rgba(9,9,121,0) 70%); }
                .hover-glow:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(124,58,237,0.2) !important; border-color: rgba(124,58,237,0.4) !important; }
                .transition-all { transition: all 0.3s ease; }
            `}</style>
        </div>
    );
};

export default Landing;
