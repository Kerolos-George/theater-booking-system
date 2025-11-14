import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <div className="landing-content">
        <h1 className="landing-title">
        Church Theater Booking Made Easy
        </h1>
        <p className="landing-description">
        Easily reserve the church theater for events and rehearsals with our dedicated booking system designed to manage schedules with accuracy and convenience
        </p>
        <Link to="/booking" className="cta-button">
          Reserve Your Theater Experience
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
