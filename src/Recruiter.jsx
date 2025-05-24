import Register from './Register';
import './Recruiter.css';

function Recruiter({ onLoginSubmit, loginMessage }) {
  return (
    <div className="recruiter-container">
      <Register onLoginSubmit={onLoginSubmit} loginMessage={loginMessage} />
    </div>
  );
}

export default Recruiter;