import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/language-context";
import Home from "@/pages/home";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import BliUtleierPage from "@/pages/bli-utleier";
import Dashboard from "@/pages/dashboard";
import MyBookings from "@/pages/my-bookings";
import AdminPage from "@/pages/admin";
import LegalPage from "@/pages/legal";
import BusinessLanding from "@/pages/business-landing";
import BusinessDashboard from "@/pages/business-dashboard";
import ReisePage from "@/pages/reise";
import BorettslagPage from "@/pages/borettslag";
import GavekortPage from "@/pages/gavekort";
import SamarbeidPage from "@/pages/samarbeid";
import AkademiPage from "@/pages/akademi";
import ByttePage from "@/pages/bytte";
import WidgetPage from "@/pages/widget";
import ArrangementPage from "@/pages/arrangement";
import MeglerPage from "@/pages/megler";
import PendlerPage from "@/pages/pendler";
import SkatterapportPage from "@/pages/skatterapport";
import TvistmeldingPage from "@/pages/tvistmelding";
import ReferralPage from "@/pages/referral";
import BydelPage from "@/pages/bydel";
import NotFound from "@/pages/not-found";
import EmergencyHelp from "@/components/EmergencyHelp";
import LediAIChat from "@/components/LediAIChat";
import CookieBanner from "@/components/CookieBanner";
import KontraktPage from "@/pages/kontrakt";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import VerifyEmailPage from "@/pages/verify-email";
import ProfilPage from "@/pages/profil";
import Footer from "@/components/Footer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/logg-inn" component={LoginPage} />
      <Route path="/registrer" component={RegisterPage} />
      <Route path="/bli-utleier" component={BliUtleierPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/mine-bookinger" component={MyBookings} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/reise" component={ReisePage} />
      <Route path="/business" component={BusinessLanding} />
      <Route path="/business/oversikt" component={BusinessDashboard} />
      <Route path="/borettslag" component={BorettslagPage} />
      <Route path="/gavekort" component={GavekortPage} />
      <Route path="/samarbeid" component={SamarbeidPage} />
      <Route path="/akademi" component={AkademiPage} />
      <Route path="/bytt" component={ByttePage} />
      <Route path="/widget" component={WidgetPage} />
      <Route path="/arrangement/:slug" component={ArrangementPage} />
      <Route path="/megler" component={MeglerPage} />
      <Route path="/pendler" component={PendlerPage} />
      <Route path="/skatterapport" component={SkatterapportPage} />
      <Route path="/tvistmelding" component={TvistmeldingPage} />
      <Route path="/referral" component={ReferralPage} />
      <Route path="/finn/:by" component={BydelPage} />
      <Route path="/kontrakt/:id" component={KontraktPage} />
      <Route path="/glemt-passord" component={ForgotPasswordPage} />
      <Route path="/nytt-passord" component={ResetPasswordPage} />
      <Route path="/bekreft-epost" component={VerifyEmailPage} />
      <Route path="/profil" component={ProfilPage} />
      <Route path="/personvern">
        <LegalPage type="personvern" />
      </Route>
      <Route path="/vilkar">
        <LegalPage type="vilkar" />
      </Route>
      <Route path="/leiekontrakt">
        <LegalPage type="leiekontrakt" />
      </Route>
      <Route path="/salgsbetingelser">
        <LegalPage type="salgsbetingelser" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
            <Footer />
            <LediAIChat />
            <EmergencyHelp />
            <CookieBanner />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
