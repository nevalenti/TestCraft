import { Route, Routes } from "react-router";

import { CookieConsent } from "@/components/CookieConsent";
import { Notifications } from "@/components/Notifications";
import { Footer } from "@/layout/Footer";
import { Header } from "@/layout/Header";
import { Home } from "@/pages/Home";
import { NotFound } from "@/pages/NotFound";

const AppLayout = () => {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-360 flex-col">
      <Header />
      <main className="flex flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Notifications />
      <CookieConsent />
    </div>
  );
};

export default AppLayout;
