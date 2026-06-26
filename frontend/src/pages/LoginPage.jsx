import BrandingPanel from "../components/BrandingPanel";
import LoginForm from "../components/LoginForm";
import Logo from "../components/Logo";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <BrandingPanel />

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Logo className="w-10 h-10" />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Sign in to your CareerPilot account to continue
            </p>
          </div>

          {/* Form */}
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
