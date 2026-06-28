import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1f1d3d] items-center justify-center p-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold text-black">CP</span>
          </div>
          <h1 className="text-4xl font-light text-white tracking-tight mb-4">CareerPilot</h1>
          <p className="text-lg text-white/60 font-light max-w-sm">
            Your AI-powered career assistant for job applications and interview preparation
          </p>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
              <span className="text-lg font-bold text-white">CP</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-light text-black tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-base text-gray-500 font-light">
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
