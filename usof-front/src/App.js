import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Login from './Login';
import Main from './Main';
import Register from './Register';
import EditProfile from './EditProfile';
import ForgotPassword from './ForgotPassword';
import Profile from './Profile';
import ViewPosts from './ViewPosts';
import AddForm from './AddForm';
import GenericPostPage from './GenericPostPage';
import Notifications from './Notifications';
import EditForm from './EditForm';
import PostPage from './PostPage';
import AddComment from './AddComment';
import EditComment from './EditComment';
import AdminPanel from './AdminPanel';
import AddCategory from './AddCategory';
import EditCategory from './EditCategory';
import AddUser from './AddUser';
import { registerLicense } from '@syncfusion/ej2-base';

function App() {
   registerLicense('Ngo9BigBOggjHTQxAR8/V1NDaF1cWWhIfEx0THxbf1x0ZFxMY1tbRH9PMyBoS35RckRiW3ZeeXBWR2hbUkxz');
   return (
        <Router>
           <AuthProvider>
            <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot" element={<ForgotPassword />} />
                <Route path="/confirm-email/:token" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/edit" element={<EditProfile />} />
                <Route path="/edit_post/:id" element={<EditForm />} />
                <Route path="/view_posts" element={<ViewPosts />} />
                <Route path="/add_post" element={<AddForm />} />
                <Route path="/favorites" element={<GenericPostPage postPath="posts/favorites" imageSrc="/fav_girl.png"/>} />
                <Route path="/subscriptions" element={<GenericPostPage postPath="posts/subscriptions" imageSrc="/subscribe_girl.png"/>} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/posts/:id" element={<PostPage />} />
                <Route path="/add_comment/post/:postId" element={<AddComment />} />
                <Route path="/add_comment/comment/:commentId" element={<AddComment />} />
                <Route path="posts/:postId/edit_comment/:commentId" element={<EditComment />} />
                <Route path="/admin_panel" element={<AdminPanel />} />
                <Route path="/add_category" element={<AddCategory />} />
                <Route path="/edit_category/:categoryId" element={<EditCategory />} />
                <Route path="/add_user" element={<AddUser />} />
                <Route path="/edit_user/:userId" element={<EditProfile />} />
            </Routes>
           </AuthProvider>
        </Router>
    );
}

export default App;
