import './AddEditForms.css';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import axiosInstance from './AxiosConfig';

function EditProfile() {
  let { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [role, setRole] = useState('user');
  const [newAvatar, setNewAvatar] = useState(null);
  const [initialData, setInitialData] = useState({});
  const authToken = localStorage.getItem('authToken');
  const decodedToken = jwtDecode(authToken);
  userId = userId ? atob(userId) : null;

  const editData = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const updatedData = {
      login,
      password,
      email,
      full_name: fullName,
      avatar: newAvatar,
      role,
    };

    const changedData = {};

    Object.entries(updatedData).forEach(([key, value]) => {
      if (key === 'password' && value === '') {
        return;
      }
      if (key === 'fullName' && value !== '') {
        if (value !== initialData[key]) {
          changedData[key] = value;
        }
        return;
      }
      if (key === 'avatar') {
        return;
      }
      if (value !== initialData[key]) {
        changedData[key] = value;
      }
    });

    if (Object.keys(changedData).length === 0 && (updatedData['avatar'] === null)) {
      alert('No changes made');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    if (newAvatar) {
        formData.append('avatar', newAvatar);
    }

    try {
      let userToChange = userId || decodedToken.userId;
      if (Object.keys(changedData).length > 0) {
        const response = await axiosInstance.patch(`users/${userToChange}`, changedData);
        if (updatedData['avatar'] === null) {
          alert("Profile edited successfully");
        }
      }
      if (updatedData['avatar'] !== null) {
        alert("Profile edited successfully");
        setAvatar(URL.createObjectURL(newAvatar));
        const resp = await axiosInstance.patch(`users/${userToChange}/avatar/file`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${authToken}`,
          },
        });
      }
    } catch (err) {
      alert(err.response?.data?.error);
      console.log(err);
      setError(err);
    } finally {
      setLoading(false);
    }
    }

    const getUserData = async () => {
      const userToFind = userId || decodedToken.userId;
      const resp = await axiosInstance.get(`users/${userToFind}`);
      const data = resp.data[0];
      setLogin(data.login);
      setEmail(data.email);
      setFullName(data.full_name);
      setAvatar(`http://localhost:5000/uploads/${data.profile_picture}`);
      setRole(data.role);

      setInitialData({
        login: data.login,
        password: data.password,
        email: data.email,
        full_name: data.full_name,
        avatar: data.profile_picture,
        role: data.role,
      });
    };

  const handleAvatarChange = (e) => {
    setNewAvatar(e.target.files[0]);
    setAvatar(URL.createObjectURL(e.target.files[0]));
  }

  useEffect(() => {
    getUserData();
  }, []);

  return (
	<form onSubmit={editData} class='login-form edit-form' id='edit-form'>
           {userId && (
             <h1 id='form-header'>Edit User</h1>
           )}
           {!userId && (
             <h1 id='form-header'>Edit Profile</h1>
           )}

           <label class='login-label'>Login</label><br/><br/>
           <input class='login-input' type="text" pattern="^[A-Za-z0-9]+$" title='Login can contain only letters and numbers' placeholder="Enter New Login" id="login" defaultValue={login} onChange={(e) => setLogin(e.target.value)} required /> <br/>
           <label class='login-label' id='pwd-label'>Password</label><br/><br/>
           <input class='login-input' type="password" pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$" title='The password contains at least 6 characters, including at least 1 letter and 1 number' placeholder="New Password" id="password" defaultValue={password} onChange={(e) => setPassword(e.target.value)} /> <br/>
           <label class='login-label'>Email</label><br/><br/>
           <input class='login-input' type="email" placeholder="Enter New Email" id="email" defaultValue={email} onChange={(e) => setEmail(e.target.value)} required /> <br/>
           <label class='login-label' id="full-name-label">Full name</label><br/><br/>
           <input class='login-input' type="text" placeholder="Enter Full Name" id="full-name" defaultValue={fullName} onChange={(e) => setFullName(e.target.value)} /> <br/>
           <label class='login-label' id='avatar-label'>Avatar</label><br/><br/>
           <img id='picture' src={avatar} alt="Profile"/><br/>
           <input class='login-input' type="file" id="avatar" defaultValue={newAvatar} onChange={handleAvatarChange} /> <br/>
           {userId && (<><label class='login-label' id='role-label'>Role</label>
           <select id='select-role' value={role} onChange={(e) => setRole(e.target.value)}>
             <option value="user">User</option>
             <option value="admin">Admin</option>
           </select></>)}

           <br/><br/><button id='login-btn' class='submit-btn' type="submit">Edit</button><br/>
           {!userId && (
             <><a class='a-login-form' href="/" id="cancel-btn">Cancel</a><br/><br/></>
           )}
           {userId && (
             <><a class='a-login-form' href="/admin_panel" id="cancel-btn">Cancel</a><br/><br/></>
           )}
       </form>
  );
}

export default EditProfile;
