import './Login.css';
import { useEffect, useState } from 'react';
import axiosInstance from './AxiosConfig';

function AddUser() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');

  const addUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post(`users`, {
        login,
        password,
        confirmPass,
        email,
        role,
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
	<form onSubmit={addUser} id='register-form'>
           <h1 id='form-header'>Add User</h1>
           <label class='login-label'>Login</label><br/><br/>
           <input class='login-input' type="text" pattern="^[A-Za-z0-9]+$" title='Login can contain only letters and numbers' placeholder="Enter Login" id="login" value={login} onChange={(e) => setLogin(e.target.value)} required /> <br/>
           <label class='login-label' id='pwd-label'>Password</label><br/><br/>
           <input class='login-input' type="password" pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$" title='The password contains at least 6 characters, including at least 1 letter and 1 number' placeholder="Enter Password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required /> <br/>
           <label class='login-label' id='conf-pwd-label'>Confirm Password</label><br/><br/>
           <input class='login-input' type="password" pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$" title='The password contains at least 6 characters, including at least 1 letter and 1 number' placeholder="Confirm Password" id="confirmPass" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required /> <br/>
           <label class='login-label'>Email</label><br/><br/>
           <input class='login-input' type="email" placeholder="Enter Email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required /> <br/>
           <label class='login-label'>Role</label><br/><br/>
           <select id='select-role' value={role} onChange={(e) => setRole(e.target.value)}>
             <option value="user">User</option>
             <option value="admin">Admin</option>
           </select>
           <br/><br/><button id='login-btn' type="submit">Add</button><br/>

           <a class='a-login-form' href="/admin_panel" id="cancel-btn">Cancel</a><br/><br/><br/>
        </form>
  );
}

export default AddUser;
