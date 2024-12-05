import './Main.css';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from './AxiosConfig';
import { useAuth } from './AuthContext';

function Notifications() {
  const [isAuth, setAuth] = useState(false);
  const [isOpen, setStatus] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const notifNumber = 4;
  const [userData, setUserData] = useState({ login: '', role: '' });
  const { decodedToken, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setStatus(!isOpen);
  };

  const toggleSettings = () => {
    setMenuVisible(!isMenuVisible);
  };

  const getUserData = async () => {
    try {
      const resp = await axiosInstance.get(`users/${decodedToken.userId}`);
      const data = resp.data[0];
      setAvatar(`http://localhost:5000/uploads/${data.profile_picture}`);
      setUserData({ login: data.login, role: data.role });
    }
    catch (err) {
      logout();
    }
  }

  const pageChange = (page) => {
    setCurrentPage(page);
  };

  const fetchMessages = async (page) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`notifications?page=${page}`);
      const { messages, total } = response.data;
      setMessages(messages);
      setTotalPages(Math.ceil(total / notifNumber));
    } catch (error) {
      setError('Failed to fetch posts');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(`notifications/${messageId}`);
      document.getElementById(messageId).classList.add('hidden');
    } catch (error) {
      setError('Failed to mark notification as read');
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages(currentPage);
    getUserData();
    const token = localStorage.getItem("authToken");
    if (token) {
      setAuth(true);
    }
  }, [currentPage]);

  return (
    <div>
    <header class="header">
       <div class="logo">
         {isAuth && decodedToken && decodedToken.role === 'admin' ? (
            <a href='admin_panel'><h1>Wise Advice</h1></a>
         ) : (
            <h1>Wise Advice</h1>
         )}
       </div>
       <div class='dropdown-menu'>
       <a onClick={toggleMenu} class="menu-button">
           Menu
       </a>
       {isOpen && (
         <div class='menu menu-option'>
            <Link class='top-option' to='/'>Home</Link>
            <Link class='top-option' to='/favorites'>Favorites</Link>
            <Link class='top-option' to='/subscriptions'>Subscriptions</Link>
            <Link class='top-option' to='/notifications'>Notifications</Link>
         </div>
       )}
       </div>
       <input class='search-input'></input>
       <img id='search'  src={'/search.png'} class='search-button' />
       <div class='dropdown-menu'>
       <img class='header-img' id='settings' onClick={toggleSettings} src={'/settings.png'} alt='Settings button'></img>
         {isMenuVisible && (
         <div class='menu menu-option'>
            <a class='top-option' onClick={logout} >Logout</a>
         </div>
         )}
       </div>
       <p id='user-desc'>{decodedToken && userData.login}<br />
          {decodedToken && userData.role}</p>
       <a href='/profile'><img class='header-img' id='avatar' src={avatar}></img></a>
    </header>

   <div class='main-container'>
   <div class='posts-container'>
     {messages.map(message => (
      <div class='post notif'>
           <h2>{message.message}</h2>
           <span class='date'>{message.created_at.split('T')[0]}</span>
           <span id={message.id} class={`mar ${message.is_read ? 'hidden' : ''}`} onClick={() => markAsRead(message.id)}><em>mark as read</em></span>
      </div>
     ))}

     <div class="pagination notif-pagin">
      {Array.from({ length: totalPages }, (_, index) => (
         <button
            key={index + 1}
            onClick={() => pageChange(index + 1)}
            class={currentPage === index + 1 ? 'active' : 'inactive'}>
         {index + 1}
          </button>
      ))}
     </div>
  </div>

  <div>
    <img src={'/notif_girl.png'} id='notif_girl' alt=''/>
  </div>

  </div>
  <footer class='footer'>
      <p>Developed for you with ❤️  by Yana Levchenko</p>
      <div class='contact'>
        <p>Contact Us</p>
        <a href='https://mail.google.com/mail/u/0/#inbox?compose=GTvVlcSMTFPfGXtgxswBTTjXPhrJVQmtBCSdpTqWSMSMgpMDnpCLmrHpMtCMXJxDnnhRPJSCdNfdD'><img class='contact-icon' src={'/gmail.png'}/></a>
        <a href='https://github.com/Yana19Levchenko'><img class='contact-icon' src={'/github.png'}/></a>
        <a href='https://www.linkedin.com/in/yana-levchenko-b54317289/'><img class='contact-icon' src={'/linkedin.png'}/></a>
      </div>
    </footer>
  </div>
  );
}

export default Notifications;

