import './Login.css';
import { useState } from 'react';
import axios from 'axios';
const API_URL = 'http://localhost:5000/api';

function ForgotPassword() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');

  const ResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/auth/password-reset`, {
        email,
      });

      alert(response.data.message);
    } catch (err) {
      alert(err.response?.data?.message);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
	<form onSubmit={ResetPassword} class='login-form'>
           <h1 id='form-header'>Reset Password</h1>
           <label class='login-label'>Email</label><br/><br/>
           <input class='login-input' type="email" placeholder="Enter Email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required /> <br/>

           <br/><br/><button id='login-btn' type="submit">Reset Password</button><br/>

           <a class='a-login-form' href="/" id="cancel-btn">Cancel</a><br/><br/>
        </form>
  );
}

export default ForgotPassword;
