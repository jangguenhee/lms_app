import Link from 'next/link';
import { BookOpen, Users, Award, ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
              온라인 강의를
              <br />
              쉽게 만들고 배우세요
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              VMC LMS는 강사와 학습자를 위한 최고의 학습 관리 시스템입니다.
              코스를 만들고, 과제를 관리하고, 성장하세요.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/courses"
                className="group flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
              >
                코스 둘러보기
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
              <Link
                href="/signup"
                className="rounded-lg border border-slate-600 px-6 py-3 text-base font-semibold text-white transition hover:border-slate-400 hover:bg-slate-800"
              >
                시작하기
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-600 to-purple-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              모든 것이 한 곳에
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              강의부터 평가까지, 필요한 모든 기능을 제공합니다
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<BookOpen className="h-8 w-8" />}
              title="코스 관리"
              description="직관적인 인터페이스로 코스를 쉽게 생성하고 관리하세요. 드래그 앤 드롭으로 콘텐츠를 구성할 수 있습니다."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="과제 & 평가"
              description="과제를 출제하고, 제출물을 검토하며, 피드백을 제공하세요. 자동 채점 기능도 지원합니다."
            />
            <FeatureCard
              icon={<Award className="h-8 w-8" />}
              title="학습 추적"
              description="학습자의 진도와 성취도를 실시간으로 추적하고, 데이터 기반 인사이트를 얻으세요."
            />
          </div>
        </div>
      </section>

      {/* For Instructors Section */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                강사를 위한 강력한 도구
              </h2>
              <p className="mt-4 text-lg text-slate-300">
                코스 제작부터 학습자 관리까지, 모든 과정을 효율적으로 진행하세요.
              </p>
              <ul className="mt-8 space-y-4">
                <BenefitItem text="무제한 코스 생성" />
                <BenefitItem text="과제 자동 마감 관리" />
                <BenefitItem text="실시간 학습 분석" />
                <BenefitItem text="일괄 채점 및 피드백" />
              </ul>
              <Link
                href="/signup"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
              >
                강사로 시작하기
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                학습자를 위한 최적의 경험
              </h2>
              <p className="mt-4 text-lg text-slate-300">
                원하는 코스를 찾아 수강하고, 체계적으로 학습하세요.
              </p>
              <ul className="mt-8 space-y-4">
                <BenefitItem text="다양한 분야의 코스" />
                <BenefitItem text="진도 자동 저장" />
                <BenefitItem text="과제 제출 및 피드백" />
                <BenefitItem text="성적 및 수료증 관리" />
              </ul>
              <Link
                href="/courses"
                className="mt-8 inline-flex items-center gap-2 rounded-lg border border-slate-600 px-6 py-3 text-base font-semibold text-white transition hover:border-slate-400 hover:bg-slate-800"
              >
                코스 둘러보기
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            지금 바로 시작하세요
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            회원가입은 무료입니다. 지금 바로 코스를 만들거나 학습을 시작하세요.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-white px-8 py-4 text-lg font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
            >
              무료로 시작하기
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-slate-600 px-8 py-4 text-lg font-semibold text-white transition hover:border-slate-400 hover:bg-slate-800"
            >
              로그인
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-12">
        <div className="mx-auto max-w-7xl text-center text-sm text-slate-400">
          <p>© 2025 VMC LMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-8 transition hover:border-slate-600">
      <div className="mb-4 text-blue-400">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
      <p className="text-slate-300">{description}</p>
    </div>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-400" />
      <span className="text-slate-200">{text}</span>
    </li>
  );
}
