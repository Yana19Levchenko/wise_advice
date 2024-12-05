import './Main.css';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from './AxiosConfig';
import { useAuth } from './AuthContext';

function GenericPostPage({ postPath, imageSrc }) {
  const [isAuth, setAuth] = useState(false);
  const [isOpen, setStatus] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortCondition, setSortCondition] = useState(null);
  const [searchCategory, setSearchCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterDate, setFilterDate] = useState({ start: '', end: '' });
  const { decodedToken, logout } = useAuth();
  const [userData, setUserData] = useState({ login: '', role: '' });
  const postsNumber = 3;
  const navigate = useNavigate();

  const toggleMenu = () => {
    setStatus(!isOpen);
  };

  const toggleSettings = () => {
    setMenuVisible(!isMenuVisible);
  };

  const getPostsWithCategories = async (posts) => {
    return await Promise.all(posts.map(async (post) => {
        const categoriesResponse = await axiosInstance.get(`posts/${post.id}/categories`);
        return { ...post, categories: categoriesResponse.data };
    }));
  };

  const fetchPosts = async (page, sortCondition, filterStatus, selectedCategories, filterDate) => {
    setLoading(true);
    try {
      let url = `${postPath}?page=${page}`;
      if (sortCondition) {
        url += `&sort=${sortCondition}`;
      }
      else {
        url += `&sort=date`;
      }
      if (filterStatus) {
        url += `&status=${filterStatus}`;
      }
      if (selectedCategories.length > 0) {
        url += `&categories=${selectedCategories.join(',')}`;
      }
      if (filterDate.start && filterDate.end) {
        url += `&dateInterval=${filterDate.start}%2C${filterDate.end}`;
      }
      const response = await axiosInstance.get(url);
      const { posts, total } = response.data;
      const postsWithCategories = await getPostsWithCategories(posts);
      setPosts(postsWithCategories);
      setTotalPages(Math.ceil(total / postsNumber));
    } catch (error) {
      setError('Failed to fetch posts');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`categories`);
      const categories = response.data;
      setCategories(categories);
    } catch (error) {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    fetchPosts(currentPage, sortCondition, filterStatus, selectedCategories, filterDate);
    fetchCategories();
    if (decodedToken) {
      setAuth(true);
      getUserData();
    }
  }, [currentPage, postPath, decodedToken, sortCondition, filterStatus, selectedCategories, filterDate]);

  const sortBy = async (condition, page) => {
    setLoading(true);
    setPosts([]);
    setSortCondition(condition);
      try {
        const response = await axiosInstance.get(`${postPath}?sort=${condition}&page=${page}`);
        const { posts, total } = response.data;
        const postsWithCategories = await getPostsWithCategories(posts);
        setPosts(postsWithCategories);
      } catch (error) {
        setError('Failed to fetch posts');
      } finally {
        setLoading(false);
      }
  };

  const ChooseCategory = async (category) => {
    setLoading(true);
    if (selectedCategories.includes(category.title)) {
      rmCategory(category);
    }
    else {
    	document.getElementById(category.id).classList.add('active-category');
        setSelectedCategories([...selectedCategories, category.title]);
        const updatedCategories = [...selectedCategories, category.title];
    	ShowCategories(updatedCategories, currentPage);
    }
  };

  const ShowCategories = async (categories, page) => {
    setPosts([]);
    try {
        const response = await axiosInstance.get(`${postPath}?categories=${categories}&page=${page}`);
        const { posts, total } = response.data;
        if (Math.ceil(total / postsNumber) < page) {
          setCurrentPage(1);
        }
        const postsWithCategories = await getPostsWithCategories(posts);
        setPosts(postsWithCategories);
        setTotalPages(Math.ceil(total / postsNumber));
      } catch (error) {
        setError('Failed to fetch posts');
      } finally {
        setLoading(false);
      }
  }

  const rmCategory = async (category) => {
    document.getElementById(category.id).classList.remove('active-category');
    setSelectedCategories(prev => prev.filter(title => title !== category.title));
    const updatedCategories = selectedCategories.filter(title => title !== category.title);
    ShowCategories(updatedCategories, currentPage);
  };

  const filterByDate = async (event, page) => {
    event.preventDefault();
    const startDate = document.getElementById('date-from').value;
    const endDate = document.getElementById('date-to').value;

    if (startDate > endDate) {
      alert('The start date cannot be greater than the end date.');
      return;
    }

    setPosts([]);
    setFilterDate({ start: startDate, end: endDate });
    try {
        const response = await axiosInstance.get(`${postPath}?dateInterval=${startDate}%2C${endDate}&page=${page}`);
        const { posts, total } = response.data;
        if (Math.ceil(total / postsNumber) < page) {
          setCurrentPage(1);
        }
        const postsWithCategories = await getPostsWithCategories(posts);
        setPosts(postsWithCategories);
        setTotalPages(Math.ceil(total / postsNumber));
    } catch (error) {
        console.error('Error fetching posts:', error);
        setError('Failed to fetch posts');
    } finally {
        setLoading(false);
    }
  }

  const filterByStatus = async (status, page) => {
    setPosts([]);
    setFilterStatus(status);
    try {
        const response = await axiosInstance.get(`${postPath}?status=${status}&page=${page}`);
        const { posts, total } = response.data;
        if (Math.ceil(total / postsNumber) < page) {
          setCurrentPage(1);
        }
        const postsWithCategories = await getPostsWithCategories(posts);
        setPosts(postsWithCategories);
        setTotalPages(Math.ceil(total / postsNumber));
    } catch (error) {
        setError('Failed to fetch posts');
    } finally {
        setLoading(false);
    }
  }

  const deletePost = async (post) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this post?");
    if (isConfirmed) {
      try {
        const path = (postPath === 'posts/favorites') ? 'favorites' : 'unsubscribe';
        const response = await axiosInstance.delete(`posts/${post.id}/${path}`);
        fetchPosts(currentPage, sortCondition, filterStatus, selectedCategories, filterDate);
      } catch (err) {
        alert(err.response?.data?.message);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const findByCategoryTitle = async (page) => {
    setLoading(true);
    setPosts([]);
    try {
      const searchCategoryInput = document.getElementById('search-data').value;
      if (searchCategoryInput !== '' && searchCategoryInput !== null) {
        setSelectedCategories([...selectedCategories, searchCategoryInput]);
      }
      else {
        if (selectedCategories.includes(searchCategoryInput)) {
          rmCategory(searchCategory);
        }
      }
      setSearchCategory(searchCategoryInput);
      const response = await axiosInstance.get(`${postPath}?categories=${searchCategoryInput}&page=${page}`);
      const { posts, total } = response.data;
      const postsWithCategories = await getPostsWithCategories(posts);
      setPosts(postsWithCategories);
      setTotalPages(Math.ceil(total / postsNumber));
    } catch (error) {
      setError('Failed to fetch posts');
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

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
            {!isAuth && (
               <>
                  <a class='top-option' href='#'>About</a>
                  <a href='#'>Contact Us</a>
               </>
            )}
            {isAuth && (
               <>
                 <Link class='top-option' to='/'>Home</Link>
                 <Link class='top-option' to='/favorites'>Favorites</Link>
                 <Link class='top-option' to='/subscriptions'>Subscriptions</Link>
                 <Link class='top-option' to='/notifications'>Notifications</Link>
               </>
            )}
         </div>
       )}
       </div>
       <input id='search-data' class='search-input'></input>
       <img id='search'  src={'/search.png'} class='search-button' onClick={() => findByCategoryTitle(currentPage)}/>
       <div class='dropdown-menu'>
       <img class='header-img' id='settings' onClick={toggleSettings} src={'/settings.png'} alt='Settings button'></img>
         {isMenuVisible && (
         <div class='menu menu-option'>
             {!isAuth && (
               <>
                 <Link class='top-option' to='/login'>Login</Link>
                 <Link class='top-option' to='/register'>Register</Link>
               </>
             )}
             {isAuth && (
                 <a class='top-option' onClick={logout} >Logout</a>
             )}
         </div>
         )}
       </div>
       <p id='user-desc'>{decodedToken && userData.login}<br />
          {decodedToken && userData.role}</p>
       <a href='/profile'><img class='header-img' id='avatar' src={avatar}></img></a>
    </header>

    <div class='main-container'>
    <div class='sort-filter-block'>
      <p><b>Sort by</b></p>
      <button class='sort-status-button' onClick={() => sortBy('likes', currentPage)}>likes</button>
      <button class='sort-filter-button sort-status-button' onClick={() => sortBy('date', currentPage)}>date</button>
      <p id='filter-header'><b>Filter</b></p>

      <p>categories</p>
      <div class='categories-container'>
         {categories.map(category => (
           <div id={category.id} class='category' key={category.id} onClick={() => ChooseCategory(category)}>
             <span>{category.title}</span>
           </div>
         ))}
      </div>
      <p>date</p>
      <form>
        <input id='date-from' title='YYYY-MM-DD' class='filter-input' pattern='^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$' placeholder="from"></input>
        <input id='date-to' title='YYYY-MM-DD' class='filter-input' pattern='^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$' placeholder="to"></input>
        <button type="submit" class='sort-status-button' id='filter-btn' onClick={(event) => filterByDate(event, currentPage)}>Filter by date</button>
      </form>
      <p>status</p>
      <button class='sort-status-button' onClick={() => filterByStatus('active', currentPage)}>active</button>
      <button class='sort-filter-button sort-status-button' onClick={() => filterByStatus('inactive', currentPage)}>inactive</button>
      <button class='sort-filter-button sort-status-button' onClick={() => setFilterStatus(null)}>all</button>
    </div>

   <div class='posts-container'>
     {posts.map(post => (
       <a href={`posts/${btoa(post.id)}`} class='post profile'><div key={post.id}>
           <a onClick={() => deletePost(post)} class='del-post'><em>delete</em></a>
           <h2>{post.title}</h2>
           {post.categories.map(category => (
             <span class='categories' key={category.id}> {category.title} </span>
           ))}
           <ReactMarkdown className='content'>{post.content}</ReactMarkdown>
           <span class='date'>{post.publish_date.split('T')[0]}</span>
           <span class='post-author'>{post.author}</span>
       </div></a>
     ))}

     <div id='main-pagination' class="pagination admin-pagination">
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
    <img src={imageSrc} id={imageSrc.slice(1).split('.')[0]} alt=''/>
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

export default GenericPostPage;
