import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel - Dark */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#272729] items-center justify-center p-12">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-8">
            <span className="text-3xl font-semibold text-white">CP</span>
          </div>
          <h1 className="text-5xl font-semibold text-white tracking-tight mb-4" style={{ letterSpacing: "-0.28px" }}>CareerPilot</h1>
          <p className="text-xl text-white/70 max-w-sm" style={{ lineHeight: "1.47" }}>
            Your AI-powered career assistant for job applications and interview preparation
          </p>
        </div>
      </div>

      {/* Right login form - Light */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-[#272729] flex items-center justify-center">
              <span className="text-2xl font-semibold text-white">CP</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-4xl font-semibold text-[#1d1d1f] tracking-tight" style={{ letterSpacing: "-0.374px" }}>
              Welcome back
            </h1>
            <p className="mt-3 text-lg text-[#1d1d1f]/60" style={{ lineHeight: "1.47" }}>
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
