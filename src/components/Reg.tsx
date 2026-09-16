"use client";

import { Mail, Phone } from "lucide-react";
import { useForm } from "react-hook-form";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
};

export default function Reg() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    console.log(data);

    alert("Form submitted successfully!");

    reset();
  };

  return (
    <section className="w-full bg-white py-12 px-5">
      <div className="max-w-7xl mx-auto">

      
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8 mb-8">

          <a
  href="mailto:contact@techsuitesystems.com"
  className="flex flex-col justify-center border border-gray-300 rounded-2xl px-6 py-5 sm:px-8 sm:py-6 min-h-[150px] hover:shadow-lg transition-all duration-300"
>
  <div className="flex items-center gap-3">
    <Mail className="w-8 h-8 text-gray-700" />
    <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">
      E-mail
    </h2>
  </div>

  <p className="mt-4 text-base md:text-lg text-gray-600 break-all">
    contact@techsuitesystems.com
  </p>
</a>

          <a
  href="tel:+919940053883"
  className="flex flex-col justify-center border border-gray-300 rounded-2xl px-6 py-5 sm:px-8 sm:py-6 min-h-[150px] hover:shadow-lg transition-all duration-300"
>
  <div className="flex items-center gap-3">
    <Phone className="w-8 h-8 text-gray-700" />
    <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">
      Phone
    </h2>
  </div>

  <p className="mt-4 text-base md:text-lg text-gray-600 leading-7">
    +91 04430170400
    <br />
    +91 99400 53883
  </p>
</a>

        </div>

        
        <div className="bg-gray-200 rounded-3xl p-6 md:p-10">

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <input
                  type="text"
                  placeholder="First Name"
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                  className="w-full border border-gray-500 rounded-lg p-4 outline-none"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Last Name"
                  {...register("lastName", {
                    required: "Last name is required",
                  })}
                  className="w-full border border-gray-500 rounded-lg p-4 outline-none"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: "Enter a valid email",
                    },
                  })}
                  className="w-full border border-gray-500 rounded-lg p-4 outline-none"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="Phone No."
                  {...register("phone", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: "Enter a valid 10-digit phone number",
                    },
                  })}
                  className="w-full border border-gray-500 rounded-lg p-4 outline-none"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

            </div>

            <div>
              <textarea
                rows={6}
                placeholder="Your Message"
                {...register("message", {
                  required: "Message is required",
                  minLength: {
                    value: 10,
                    message: "Message must be at least 10 characters",
                  },
                })}
                className="w-full border border-gray-500 rounded-lg p-4 outline-none resize-none"
              />

              {errors.message && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.message.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white text-xl py-4 rounded-xl transition"
            >
              {isSubmitting ? "Submitting..." : "Submit Form"}
            </button>

          </form>

        </div>

      </div>
    </section>
  );
}