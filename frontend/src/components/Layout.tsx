import Header from './Header';
import Footer from './Footer';
import { Outlet } from '@tanstack/react-router';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
