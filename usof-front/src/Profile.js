import './Profile.css';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import axiosInstance from './AxiosConfig';

function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [rating, setRating] = useState('');
  const authToken = localStorage.getItem('authToken');
  const decodedToken = jwtDecode(authToken);

  const getUserData = async () => {
    const resp = await axiosInstance.get(`users/${decodedToken.userId}`);
    const data = resp.data[0];
    setLogin(data.login);
    setEmail(data.email);
    setFullName(data.full_name);
    setRating(data.rating);
    setAvatar(`http://localhost:5000/uploads/${data.profile_picture}`);
  };

  useEffect(() => {
    getUserData();
  }, []);

  return (
        <>
        <a href='/' id='back-link'>Go back to home page...</a>
	<form id='profile-form'>
           <img id='prof-picture' src={avatar} alt="Avatar"/><br/>
           <p class='main-info'>Login: <span>{login}</span></p>
           <p class='main-info'>Email: <span>{email}</span></p>
           {fullName && <p class='main-info'>Full name: <span>{fullName}</span></p>}
           <p class='main-info' id='rating'>Karma: <span>{rating}</span></p>
           <a href='/edit' id='edit-link'>Edit profile</a>
           <a href='/view_posts' id='posts-link'>View posts</a>
       </form>
       </>
  );
}

export default Profile;
