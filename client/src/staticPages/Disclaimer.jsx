import React from "react";

const disclaimerData = [
  {
    title: "Breadcrumb",
    content: (
      <>
        <a href="/" className="text-grey-600">Home</a> / 
        <a href="/" className="text-[#E33831]">Disclaimer</a>
      </>
    ),
  },
  {
    title: "Disclaimer",
    content: (
      <>
        <h1 className="text-3xl font-semibold mb-4">Disclaimer</h1>
        <p className="mb-6">
          Exportersindia.com welcomes you to India's pioneered web info galaxy. Genuine
          information dissemination is one of the prime objectives of Exportersindia.com
          that makes our business a matter of reliability and trustworthy affairs. In order to
          build up authentic business relations with you, we would like to present before you
          all details about our terms and conditions.
        </p>
      </>
    ),
  },
  {
    title: "Terms & Conditions",
    content: (
      <div className="[#f7f8fa] from-gray-200 to-gray-300 p-6 rounded-md border-b-4 border-[#E33831]">
        <h2 className="text-xl font-semibold text-[#E33831] mb-3">Terms & Conditions</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Exportersindia.com collects information from its registered users, visitors under certain conditions and agreements.</li>
          <li>All the information, services, software, documents, and materials available on Exportersindia.com are subject to user agreements.</li>
          <li>Exportersindia.com holds the right to modify the terms and conditions at any time.</li>
          <li>Use of displayed information, services, and materials should follow the suggested guidelines.</li>
          <li>Violation of terms may lead to immediate termination of membership.</li>
          <li>Users must verify third-party business transactions themselves.</li>
          <li>Plagiarizing or misusing content is strictly prohibited and may result in legal action.</li>
          <li>Exportersindia.com does not endorse specific business deals and provides only general information.</li>
        </ul>
        <span className="text-[#E33831] font-bold">Note: </span>
        <span className="text-black font-bold">Enquiries will be removed automatically after 1 year from the receiving date.</span>
      </div>
    ),
  },
  {
    title: "Guidelines for Use of Site Information and Materials",
    content: (
      <div className="mt-6 [#f7f8fa] from-gray-200 to-gray-300 p-6 rounded-md border-b-4 border-[#E33831]">
        <h2 className="text-lg font-bold text-[#E33831] mb-2">Guidelines for Use of Site Information and Materials</h2>
        <p className="font-semibold text-gray-800">The information on Exportersindia.com should be used under these guidelines:</p>
        <ul className="list-disc list-inside text-gray-700 mt-2">
          <li>Displayed information should strictly be used as a reference for commercial dealings.</li>
          <li>Commercial use of site information requires prior permission.</li>
          <li>Removing significant notices, copyrights, or endorsed documents is prohibited.</li>
          <li>Plagiarism or improper data labeling is an offensive act.</li>
          <li>Exportersindia.com reserves the right to restrict access to its content at any time.</li>
        </ul>
        <p className="text-gray-700 mt-2">
          The above guidelines apply to the viewing, downloading, printing, and distribution of site content.
          Copying the site's design/layout is not allowed.
        </p>
      </div>
    ),
  },
  {
    title: "Others",
    content: (
      <div className="mt-6 [#f7f8fa] from-gray-200 to-gray-300 p-6 rounded-md border-b-4 border-[#E33831]">
        <h2 className="text-lg font-bold text-[#E33831] mb-2">Others</h2>
        <ul className="list-disc list-inside text-gray-700 mt-2">
          <li>Displayed information is strictly for business reference purposes.</li>
          <li>Commercial use of statistics shown on the site requires permission.</li>
          <li>Removal of significant notices or copyrighted documents is forbidden.</li>
          <li>Plagiarism of site content may result in legal action.</li>
          <li>Exportersindia.com reserves the right to restrict access to its data at any time.</li>
        </ul>
        <p className="text-gray-700 mt-2">
          The above terms apply to all content interactions. Copying the site's layout is prohibited,
          and Exportersindia.com retains legal rights to its information.
        </p>
      </div>
    ),
  },
];

const Disclaimer = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-800">
      {disclaimerData.map((section, index) => (
        <div key={index} className="mb-6">
          {section.content}
        </div>
      ))}
    </div>
  );
};

export default Disclaimer;
