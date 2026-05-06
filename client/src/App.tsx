import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductPage from './pages/ProductPage';
import Cart from './pages/Cart';
import Favorites from './pages/Favorites';
import About from './pages/About';
import Contacts from './pages/Contacts';
import Wholesale from './pages/Wholesale';
import Cooperation from './pages/Cooperation';
import Payment from './pages/Payment';
import Search from './pages/Search';
import OrderSuccess from './pages/OrderSuccess';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminCategories from './pages/admin/Categories';
import AdminOrders from './pages/admin/Orders';

export default function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/catalog/:categorySlug" element={<Catalog />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/about" element={<About />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/wholesale" element={<Wholesale />} />
        <Route path="/cooperation" element={<Cooperation />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/search" element={<Search />} />
        <Route path="/order-success" element={<OrderSuccess />} />
      </Route>
      <Route path="/lansadmin/login" element={<AdminLogin />} />
      <Route path="/lansadmin" element={<AdminDashboard />} />
      <Route path="/lansadmin/products" element={<AdminProducts />} />
      <Route path="/lansadmin/categories" element={<AdminCategories />} />
      <Route path="/lansadmin/orders" element={<AdminOrders />} />
    </Routes>
    </>
  );
}
