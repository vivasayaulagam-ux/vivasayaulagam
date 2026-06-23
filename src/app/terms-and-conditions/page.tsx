import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Scale, Calendar, Landmark } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | Vivasaya Ulagam",
  description: "Read the Terms & Conditions and usage agreement for the Vivasaya Ulagam website and agricultural services.",
  alternates: {
    canonical: "https://vivasayaulagam.com/terms-and-conditions",
  },
};

export default function TermsAndConditionsPage() {
  const termsList = [
    "To access and use the Services, you agree to provide true, accurate, and complete information to us during and after registration, and you shall be responsible for all acts done through the use of your registered account.",
    "Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness, or suitability of the information and materials offered on this website or through the Services, for any specific purpose. You acknowledge that such information and materials may contain inaccuracies or errors, and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.",
    "Your use of our Services and the website is solely at your own risk and discretion. You are required to independently assess and ensure that the Services meet your requirements.",
    "The contents of the Website and the Services are proprietary to us, and you will not have any authority to claim any intellectual property rights, title, or interest in their contents.",
    "You acknowledge that unauthorized use of the Website or the Services may lead to action against you as per these Terms or applicable laws.",
    "You agree to pay us the charges associated with availing the Services.",
    "You agree not to use the website and/or Services for any purpose that is unlawful, illegal, or forbidden by these Terms, or Indian or local laws that might apply to you.",
    "You agree and acknowledge that the website and the Services may contain links to other third-party websites. On accessing these links, you will be governed by the terms of use, privacy policy, and such other policies of such third-party websites.",
    "You understand that upon initiating a transaction for availing the Services, you are entering into a legally binding and enforceable contract with us for the Services.",
    "You shall be entitled to claim a refund of the payment made by you in case we are not able to provide the Service. The timelines for such return and refund will be according to the specific Service you have availed or within the time period provided in our policies (as applicable). In case you do not raise a refund claim within the stipulated time, then this would make you ineligible for a refund.",
    "Notwithstanding anything contained in these Terms, the parties shall not be liable for any failure to perform an obligation under these Terms if performance is prevented or delayed by a force majeure event.",
    "These Terms and any dispute or claim relating to it, or its enforceability, shall be governed by and construed in accordance with the laws of India.",
    "All disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in Irumborai, Tamil Nadu.",
    "All concerns or communications relating to these Terms must be communicated to us using the contact information provided on this website."
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col font-sans text-gray-800">
      <Navbar />

      <main className="flex-1 pt-[calc(var(--navbar-height)+2rem)] pb-16 px-4 md:px-8">
        <div className="max-w-[900px] mx-auto">
          {/* Breadcrumb */}
          <nav className="text-xs text-gray-500 mb-6 flex items-center gap-2 pl-1 font-medium">
            <Link href="/" className="hover:text-[#34a121] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-700">Terms & Conditions</span>
          </nav>

          {/* White Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 md:p-12">
            <div className="border-b border-gray-100 pb-6 mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                <Scale className="text-[#34a121] w-8 h-8" />
                Terms & Conditions
              </h1>
              
              <div className="flex flex-wrap gap-4 mt-3 pl-1 text-xs text-gray-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-gray-400" />
                  <span>Last updated on 02-06-2025 17:19:35</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Landmark size={14} className="text-gray-400" />
                  <span>Jurisdiction: Irumborai, Tamil Nadu</span>
                </div>
              </div>
            </div>

            <div className="prose prose-green max-w-none text-sm md:text-base text-gray-700 leading-relaxed space-y-6">
              <p>
                These Terms and Conditions, along with the Privacy Policy or other terms (&ldquo;Terms&rdquo;) constitute a binding agreement by and between <strong>KUPPUSAMY ESWARAN</strong> (&ldquo;Website Owner&rdquo; or &ldquo;we&rdquo; or &ldquo;us&rdquo; or &ldquo;our&rdquo;) and you (&ldquo;you&rdquo; or &ldquo;your&rdquo;) and relate to your use of our website, goods (as applicable), or services (as applicable) (collectively, &ldquo;Services&rdquo;).
              </p>

              <p>
                By using our website and availing the Services, you agree that you have read and accepted these Terms (including the Privacy Policy). We reserve the right to modify these Terms at any time and without assigning any reason. It is your responsibility to periodically review these Terms to stay informed of updates.
              </p>

              <div className="pt-4">
                <h2 className="text-lg font-bold text-gray-900 border-l-4 border-[#34a121] pl-3 mb-6">
                  Terms of Use
                </h2>
                <ul className="space-y-4">
                  {termsList.map((term, index) => (
                    <li key={index} className="flex gap-4 items-start text-sm text-gray-700 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-green-50 text-[#34a121] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border border-green-100/50">
                        {index + 1}
                      </span>
                      <span>{term}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
