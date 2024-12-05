import './Login.css';
import { useEffect, useState } from 'react';
import axios from 'axios';
const API_URL = 'http://localhost:5000/api';

function Register() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [email, setEmail] = useState('');

  const RegisterUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        login,
        password,
        confirmPass,
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
        <>
	<form onSubmit={RegisterUser} id='register-form'>
           <h1 id='form-header'>Register</h1>
           <label class='login-label'>Login</label><br/><br/>
           <input class='login-input' pattern="^[A-Za-z0-9]+$" title='Login can contain only letters and numbers' type="text" placeholder="Enter Login" id="login" value={login} onChange={(e) => setLogin(e.target.value)} required /> <br/>
           <label class='login-label' id='pwd-label'>Password</label><br/><br/>
           <input class='login-input' type="password" pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$" title='The password contains at least 6 characters, including at least 1 letter and 1 number' placeholder="Enter Password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required /> <br/>
           <label class='login-label' id='conf-pwd-label'>Confirm Password</label><br/><br/>
           <input class='login-input' type="password" pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$" title='The password contains at least 6 characters, including at least 1 letter and 1 number' placeholder="Confirm Password" id="confirmPass" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required /> <br/>
           <label class='login-label'>Email</label><br/><br/>
           <input class='login-input' type="email" placeholder="Enter Email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required /> <br/>

           <br/><br/><button id='login-btn' type="submit">Register</button><br/>

           <a class='a-login-form' href="/" id="cancel-btn">Cancel</a><br/><br/><br/>
           <a class="forgot-psw a-login-form" href="/forgot">Forgot password?</a><br/>
           <p class='a-login-form'>Already have an account? <a href="/login">Login</a></p>
        </form>
        <img id='register-girl' src={'/register-girl.png'} alt=''/>
        </>
  );
}

export default Register;
