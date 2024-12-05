import './Main.css';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from './AxiosConfig';
import { useAuth } from './AuthContext';

function PostPage({ postPath, imageSrc }) {
  const [isAuth, setAuth] = useState(false);
  const [isOpen, setStatus] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [post, setPost] = useState({categories: [], publish_date: '', title: '', content: '', author: ''});
  const [categories, setCategories] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const { id } = useParams();
  const [userData, setUserData] = useState({ login: '', role: '' });
  const navigate = useNavigate();
  const { decodedToken, logout } = useAuth();
  const postId = id ? atob(id) : null;

  const toggleMenu = () => {
    setStatus(!isOpen);
  };

  const toggleSettings = () => {
    setMenuVisible(!isMenuVisible);
  };

  const fetchPost = async () => {
    try {
      const response = await axiosInstance.get(`posts/${postId}`);
      const data = response.data[0];
      const postData = {
        id: data.id,
        title: data.title,
        content: data.content,
        publish_date: data.publish_date,
        author: data.author,
        categories: []
      };
      const categoriesResponse = await axiosInstance.get(`posts/${postId}/categories`);
      postData.categories = categoriesResponse.data;
      setPost(postData);
    } catch (error) {
      setError('Failed to fetch post');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`posts/${postId}/comments`);
      const commentsWithDetails = isAuth ? await Promise.all(response.data.map(fetchCommentDetails)) : response.data;
      setComments(commentsWithDetails);
    } catch (error) {
      setError('Failed to fetch comments');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentDetails = async (comment) => {
    try {
      const likesResponse = await axiosInstance.get(`comments/${comment.comment_id}/like`);
      const dislikesResponse = await axiosInstance.get(`comments/${comment.comment_id}/dislike`);
      const childCommentsResponse = await axiosInstance.get(`comments/${comment.comment_id}/replies`);

      const repliesWithDetails = isAuth ? await Promise.all(childCommentsResponse.data.map(fetchReplyDetails)) : [];

      return {
        ...comment,
        likes: likesResponse.data.length,
        dislikes: dislikesResponse.data.length,
        comments: childCommentsResponse.data.length,
        replies: repliesWithDetails,
      };
    } catch (error) {
      console.error('Error fetching details for comment:', comment, error);
      return { ...comment, likes: 0, dislikes: 0, comments: 0, replies: [] };
    }
  };

  const fetchReplyDetails = async (reply) => {
    try {
      const likesResponse = await axiosInstance.get(`comments/${reply.id}/like`);
      const dislikesResponse = await axiosInstance.get(`comments/${reply.id}/dislike`);
      const childCommentsResponse = await axiosInstance.get(`comments/${reply.id}/replies`);

      const childRepliesWithDetails = await Promise.all(childCommentsResponse.data.map(fetchReplyDetails));

      return {
        ...reply,
        likes: likesResponse.data.length,
        dislikes: dislikesResponse.data.length,
        comments: childCommentsResponse.data.length,
        replies: childRepliesWithDetails,
      };
    } catch (error) {
      console.error('Error fetching details for reply:', reply, error);
      return { ...reply, likes: 0, dislikes: 0 };
    }
  };

  const getUserData = async () => {
    const resp = await axiosInstance.get(`users/${decodedToken.userId}`);
    const data = resp.data[0];
    setAvatar(`http://localhost:5000/uploads/${data.profile_picture}`);
    setUserData({ login: data.login, role: data.role });
  }

  const getReactions = async (reaction) => {
    try {
      const resp = await axiosInstance.get(`posts/${postId}/${reaction}`);
      const data = resp.data.length;
      if (reaction === 'like') {
          setLikes(data);
      }
      else if (reaction === 'dislike') {
        setDislikes(data);
      }
      else {
        setCommentsCount(data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const checkPost = async () => {
    try {
      const resp = await axiosInstance.get(`posts/subscriptions`);
      const followedPosts = resp.data.posts.map(post => post.id);
      if (followedPosts.includes(parseInt(postId))) {
        document.getElementById('follow-btn').classList.add('hidden');
      }
    } catch (error) {
      setError('Failed');
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const checkFavorites = async () => {
    try {
      const resp = await axiosInstance.get(`posts/favorites`);
      const favPosts = resp.data.posts.map(post => post.id);
      if (favPosts.includes(parseInt(postId))) {
        document.getElementById('save').src = 'http://localhost:3000/save-click.png';
      }
    } catch (error) {
      setError('Failed');
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const checkReactions = async (ind, reaction, src, srcPrev, path, type) => {
    try {
      const resp = await axiosInstance.get(`${path}/${reaction}`);
      const reactions = resp.data.map(type => type.author);

      let imgId;
      if (path.includes('favorites')) {
        imgId = 'save';
      }
      else if (path.includes('comments')) {
        const comment_id = path.split('/')[1] ;
        imgId = ind == 0 ? `${comment_id}-heart` : `${comment_id}-heart-broken` ;
      }
      else {
        imgId = ind == 0 ? `post-${postId}-heart` : `post-${postId}-heart-broken` ;
      }

      if (reactions.includes(parseInt(decodedToken.userId))) {
        document.getElementById(imgId).src = src;
      }
      else {
        document.getElementById(imgId).src = srcPrev;
      }
    } catch (error) {
      setError('Failed');
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const followPost = async () => {
    try {
      const resp = await axiosInstance.post(`posts/${postId}/subscribe`);
      document.getElementById('follow-btn').classList.add('hidden');
      alert('Subscribed to post successfully!');
    } catch (error) {
      setError('Failed');
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const changeIcons = async (ind, src1, src2, path) => {
    setLoading(true);
    let imgId;
    if (path.includes('favorites')) {
      imgId = 'save';
    }
    else if (path.includes('comments')) {
      const comment_id = path.split('/')[1] ;
      imgId = ind == 0 ? `${comment_id}-heart` : `${comment_id}-heart-broken` ;
    }
    else {
      imgId = ind == 0 ? `post-${postId}-heart` : `post-${postId}-heart-broken` ;
    }

    try {
      console.log(document.getElementById(imgId).src);
      if (document.getElementById(imgId).src === src1) {
        const resp = await axiosInstance.post(path);
        document.getElementById(imgId).src = src2;
        if (path.includes('favorites')) {
          alert('Post added to favorites successfully!');
        }
      }
      else {
        const resp = await axiosInstance.delete(path);
        document.getElementById(imgId).src = src1;
        if (path.includes('favorites')) {
          alert('Post deleted from favorites successfully!');
        }
      }
    } catch (error) {
      setError('Failed');
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const processReactionsForReplies = (replies) => {
    if (Array.isArray(replies)) {
    for (const reply of replies) {
      checkReactions(0, 'like', 'http://localhost:3000/heart-click.png', 'http://localhost:3000/heart.png', `comments/${reply.id}`);
      checkReactions(1, 'dislike', 'http://localhost:3000/heart-broken-click.png', 'http://localhost:3000/heart-broken.png', `comments/${reply.id}`);

      if (reply.replies && reply.replies.length > 0) {
        processReactionsForReplies(reply.replies);
      }
    }
    }
  };

  const handleClick = async (index, src1, src2, path, type) => {
    await changeIcons(index, src1, src2, path);
    await getReactions('like');
    await getReactions('dislike');
    await fetchComments();
    await checkReactions(0, 'like', 'http://localhost:3000/heart-click.png', 'http://localhost:3000/heart.png', path.substring(0, path.lastIndexOf('/')), type);
    await checkReactions(1, 'dislike', 'http://localhost:3000/heart-broken-click.png', 'http://localhost:3000/heart-broken.png', path.substring(0, path.lastIndexOf('/')), type);
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchPost();
      await fetchComments();
      if (decodedToken) {
        setAuth(true);
        await getReactions('like');
        await getReactions('dislike');
        await getReactions('comments');
        checkPost();
        checkFavorites();
        checkReactions(0, 'like', 'http://localhost:3000/heart-click.png', 'http://localhost:3000/heart.png', `posts/${postId}`, 'post');
        checkReactions(1, 'dislike', 'http://localhost:3000/heart-broken-click.png', 'http://localhost:3000/heart-broken.png', `posts/${postId}`, 'post');
        for (const comment of comments) {
          checkReactions(0, 'like', 'http://localhost:3000/heart-click.png', 'http://localhost:3000/heart.png', `comments/${comment.comment_id}`, 'comment');
          checkReactions(1, 'dislike', 'http://localhost:3000/heart-broken-click.png', 'http://localhost:3000/heart-broken.png', `comments/${comment.comment_id}`, 'comment');
          processReactionsForReplies(comment.replies);
        }
      }
    };
    fetchData();
  }, [comments]);

  useEffect(() => {
    if (isAuth) {
      getUserData();
    }
  }, [isAuth]);

  const deleteComment = async (commentId) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this comment?");
    if (isConfirmed) {
      try {
        const response = await axiosInstance.delete(`comments/${commentId}`);
        fetchComments();
      } catch (err) {
        alert(err.response?.data?.message);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderReplies = (replies, parentAuthor) => {
    return replies.map(reply => (
      <div key={reply.id}>
      <div class='post sp-comment reply'>
        <div>
        <span class='answer'>Answer to {parentAuthor}</span>
        {decodedToken && (reply.author === userData.login || decodedToken.role === 'admin') && (
          <a onClick={() => navigate(`edit_comment/${btoa(reply.id)}`)} class='edit-com' id='edit-btn'><em>edit</em></a>
        )}
        </div>
        <ReactMarkdown className='content'>{reply.content}</ReactMarkdown>
        <span class='date comment-date'>{reply.publish_date.split('T')[0]}</span>
        <span class='post-author comment-author'>{reply.author}</span>
        {isAuth && (<div class='icons'>
          <img class='clickable heart repl-icon' onClick={() => handleClick(0, 'http://localhost:3000/heart.png', 'http://localhost:3000/heart-click.png', `comments/${reply.id}/like`, 'comment')} src={'/heart.png'} id={`${reply.id}-heart`} alt='' />
          <span id='likes-count-cm' class='count-repl'>{reply.likes}</span>
          <img class='clickable heart-broken repl-icon' onClick={() => handleClick(1, 'http://localhost:3000/heart-broken.png', 'http://localhost:3000/heart-broken-click.png', `comments/${reply.id}/dislike`, 'comment')} src={'/heart-broken.png'} id={`${reply.id}-heart-broken`} alt='' />
          <span id='dislikes-count-cm' class='count-repl'>{reply.dislikes}</span>
          <img class='clickable repl-icon comment-rep' src={'/comment.png'} id='comment' alt='' onClick={() => navigate(`/add_comment/comment/${btoa(reply.id)}`)}/>
          <span id='comments-count-cm' class='count-repl'>{reply.comments}</span>
          {decodedToken && (reply.author === userData.login || userData.role === 'admin') && (
            <img class='clickable repl-icon delete-rep' onClick={() => deleteComment(reply.id)} src={'/delete.png'} id='delete-com' alt='' />
          )}
        </div>)}
      </div>
      {reply.replies && reply.replies.length > 0 && (
        <div class='nested'>{renderReplies(reply.replies, reply.author)}</div>
      )}
      </div>
    ));
  };

  return (
    <div class="app-container">
    <header class="header">
       <div class="logo">
         {isAuth && decodedToken && decodedToken.role === 'admin' ? (
            <a href='../admin_panel'><h1>Wise Advice</h1></a>
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
            {!isAuth ? (
               <>
                  <a class='top-option' href='#'>About</a>
                  <a href='#'>Contact Us</a>
               </>
            ) : (
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
       <input class='search-input'></input>
       <img id='search'  src={'/search.png'} class='search-button' />
       <div class='dropdown-menu'>
       <img class='header-img' id='settings' onClick={toggleSettings} src={'/settings.png'} alt='Settings button'></img>
         {isMenuVisible && (
         <div class='menu menu-option'>
             {!isAuth ? (
               <>
                 <Link class='top-option' to='/login'>Login</Link>
                 <Link class='top-option' to='/register'>Register</Link>
               </>
             ) : (
                 <a class='top-option' onClick={logout} >Logout</a>
             )}
         </div>
         )}
       </div>
       <p id='user-desc'>{isAuth && decodedToken ? userData.login : '???'}<br />
          {isAuth && decodedToken ? userData.role : 'guest'}</p>
       {isAuth ? (
           <a href='/profile'><img class='header-img' id='avatar' src={avatar}></img></a>
       ) : (
           <img class='header-img' id='avatar' src={'/default-avatar.png'}></img>
       )}
    </header>

   <div class='main-container'>
   <div>
   <div class='posts-container sp-post-cont'>
       <div class='post sp-post' key={post.id}>
           {isAuth && <a onClick={() => followPost()} class='del-post' id='follow-btn'><em>follow</em></a>}
           <h2>{post.title}</h2>
           {post.categories.map(category => (
             <span class='categories' key={category.id}> {category.title} </span>
           ))}
           <ReactMarkdown className='sp-content'>{post.content}</ReactMarkdown>
           <div>
             <span class='date sp-post-date'>{post.publish_date.split('T')[0]}</span>
             <span class='post-author sp-post-author'>{post.author}</span>
           </div>
           {isAuth && (<div class='icons'>
              <img class='clickable heart' onClick={() => handleClick(0, 'http://localhost:3000/heart.png', 'http://localhost:3000/heart-click.png', `posts/${postId}/like`, 'post')} src={'/heart.png'} id={`post-${postId}-heart`} alt='' />
              <span id='likes-count' class='count'>{likes}</span>
              <img class='clickable heart-broken' onClick={() => handleClick(1, 'http://localhost:3000/heart-broken.png', 'http://localhost:3000/heart-broken-click.png', `posts/${postId}/dislike`, 'post')} src={'/heart-broken.png'} id={`post-${postId}-heart-broken`} alt='' />
              <span id='dislikes-count' class='count'>{dislikes}</span>
              <img class='clickable' src={'/comment.png'} id='comment' alt='' onClick={() => navigate(`/add_comment/post/${btoa(postId)}`)} />
              <span id='comments-count' class='count'>{commentsCount}</span>
              <img class='clickable' onClick={() => changeIcons(2, 'http://localhost:3000/save.png', 'http://localhost:3000/save-click.png', `posts/${postId}/favorites`)} src={'/save.png'} id='save' alt='' />
           </div>)}
       </div>
  </div>


  <div class='comments-container'>
    {comments
      .sort((a, b) => a.likes - b.likes)
      .map(comment => (
      <div key={comment.comment_id}>
        <div class='post sp-comment' >
            {decodedToken && (comment.author === userData.login || userData.role === 'admin') && (
              <a onClick={() => navigate(`edit_comment/${btoa(comment.comment_id)}`)} class='del-post' id='edit-btn'><em>edit</em></a>
            )}
            <ReactMarkdown className='comment-content'>{comment.content}</ReactMarkdown>
            <span class='date comment-date'>{comment.publish_date.split('T')[0]}</span>
            <span class='post-author comment-author'>{comment.author}</span>
            {isAuth && (<div class='icons'>
               <img class='clickable heart' onClick={() => handleClick(0, 'http://localhost:3000/heart.png', 'http://localhost:3000/heart-click.png', `comments/${comment.comment_id}/like`, 'comment' )} src={'/heart.png'} id={`${comment.comment_id}-heart`} alt='' />                <span id='likes-count-cm' class='count'>{comment.likes}</span>
               <img class='clickable heart-broken' onClick={() => handleClick(1, 'http://localhost:3000/heart-broken.png', 'http://localhost:3000/heart-broken-click.png', `comments/${comment.comment_id}/dislike`, 'comment')} src={'/heart-broken.png'} id={`${comment.comment_id}-heart-broken`} alt='' />
               <span id='dislikes-count-cm' class='count'>{comment.dislikes}</span>
               <img class='clickable' src={'/comment.png'} id='comment' alt='' onClick={() => navigate(`/add_comment/comment/${btoa(comment.comment_id)}`)}/>
               <span id='comments-count-cm' class='count'>{comment.comments}</span>
               {decodedToken && (comment.author === userData.login || userData.role === 'admin') && (
                 <img class='clickable' onClick={() => deleteComment(comment.comment_id)} src={'/delete.png'} id='delete-com' alt='' />
               )}
        </div>)}
      </div>
    <div>
    {comment.replies && comment.replies.length > 0 && (
       <div class='replies-container'>
          {renderReplies(comment.replies, comment.author)}
       </div>
    )}
   </div>
   </div>
   ))}
  </div>
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

export default PostPage;
