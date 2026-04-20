import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Header    from './Header';
import Drawer    from './Drawer';
import BottomNav from './BottomNav';

export default function Layout() {
  const auth = useAuth();
  return (
    <>
      <Header auth={auth} />
      <Drawer auth={auth} />
      <Outlet context={auth} />
      <BottomNav auth={auth} />
    </>
  );
}
