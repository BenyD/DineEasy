import { Metadata } from "next";
import { UnsubscribeForm } from "./UnsubscribeForm";

export const metadata: Metadata = {
  title: "Unsubscribe from Newsletter",
  description: "Unsubscribe from DineEasy newsletter communications.",
};

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Unsubscribe from Newsletter
          </h1>
          <p className="text-gray-600">
            We&apos;re sorry to see you go. You can unsubscribe from our newsletter
            below.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <UnsubscribeForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Changed your mind?{" "}
              <a
                href="/"
                className="font-medium text-green-600 hover:text-green-500"
              >
                Return to homepage
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
