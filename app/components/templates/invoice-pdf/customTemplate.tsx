import React from "react";

// Components
import { InvoiceLayout } from "@/app/components";

// Helpers
import { formatNumberWithCommas, isDataUrl } from "@/lib/helpers";

// Variables
import { DATE_OPTIONS } from "@/lib/variables";

// Types
import { InvoiceType } from "@/types";

const senderData = {
    name: "SPC sources",
    country: "UAE",
    state: "Dubai",
    email: "contact@spcsource.com",
    address: "Dragon Mart 1, Office GBT03, Dubai",
    phone: "+971 54 500 4520",
};

const CustomTemplate = (data: InvoiceType) => {
  const { receiver, details } = data;

  return (
    <InvoiceLayout data={data}>
      <div className="flex justify-between">
        <div>
          <img
            src="/assets/img/image.jpg"
            width={140}
            height={100}
            alt="SPC Source Logo"
          />
          <h1 className="mt-2 text-lg md:text-xl font-semibold text-blue-600">
            {senderData.name}
          </h1>
        </div>
        <div className="text-right">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">
            Invoice #
          </h2>
          <span className="mt-1 block text-gray-500">
            {details.invoiceNumber}
          </span>
          <address className="mt-4 not-italic text-gray-800">
            {senderData.address}
            <br />
             {senderData.state}
            <br />
            {senderData.country}
            <br />
          </address>
        </div>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Bill to:</h3>
          <h3 className="text-lg font-semibold text-gray-800">
            {receiver.name}
          </h3>
          <address className="mt-2 not-italic text-gray-500">
            {receiver.address && receiver.address.length > 0
              ? receiver.address
              : null}
            <br />
            {receiver.state}, {receiver.country}
            <br />
          </address>
        </div>
        <div className="sm:text-right space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-2">
            <dl className="grid sm:grid-cols-6 gap-x-3">
              <dt className="col-span-3 font-semibold text-gray-800">
                Invoice date:
              </dt>
              {/* <dd className="col-span-3 text-gray-500">
                {new Date(details.invoiceDate).toLocaleDateString(
                  "en-US",
                  DATE_OPTIONS
                )}
              </dd> */}
            </dl>
            <dl className="grid sm:grid-cols-6 gap-x-3">
              <dt className="col-span-3 font-semibold text-gray-800">
                Due date:
              </dt>
              <dd className="col-span-3 text-gray-500">
                {/* {new Date(details.dueDate).toLocaleDateString(
                  "en-US",
                  DATE_OPTIONS
                )} */}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="border border-gray-200 p-1 rounded-lg space-y-1">
          <div className="hidden sm:grid sm:grid-cols-5">
            <div className="sm:col-span-2 text-xs font-medium text-gray-500 uppercase">
              Item
            </div>
            <div className="text-left text-xs font-medium text-gray-500 uppercase">
              Qty
            </div>
            <div className="text-left text-xs font-medium text-gray-500 uppercase">
              Rate
            </div>
            <div className="text-right text-xs font-medium text-gray-500 uppercase">
              Amount
            </div>
          </div>
          <div className="hidden sm:block border-b border-gray-200"></div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-y-1">
            {details.items.map((item, index) => (
              <React.Fragment key={index}>
                <div className="col-span-full sm:col-span-2 border-b border-gray-300">
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-600 whitespace-pre-line">
                    {item.description}
                  </p>
                </div>
                <div className="border-b border-gray-300">
                  <p className="text-gray-800">{item.quantity}</p>
                </div>
                <div className="border-b border-gray-300">
                  <p className="text-gray-800">{item.unitPrice} AED</p>
                </div>
                <div className="border-b border-gray-300">
                  <p className="sm:text-right text-gray-800">{item.total} AED</p>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div className="sm:hidden border-b border-gray-200"></div>
        </div>
      </div>

      <div className="mt-2 flex sm:justify-end">
        <div className="sm:text-right space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-2">
            <dl className="grid sm:grid-cols-5 gap-x-3">
              <dt className="col-span-3 font-semibold text-gray-800">
                Subtotal:
              </dt>
              <dd className="col-span-2 text-gray-500">
                {formatNumberWithCommas(Number(details.subTotal))} AED
              </dd>
            </dl>
            {details.discountDetails?.amount != undefined &&
              details.discountDetails?.amount > 0 && (
                <dl className="grid sm:grid-cols-5 gap-x-3">
                  <dt className="col-span-3 font-semibold text-gray-800">
                    Discount:
                  </dt>
                  <dd className="col-span-2 text-gray-500">
                    {details.discountDetails.amountType === "amount"
                      ? `- ${details.discountDetails.amount} AED`
                      : `- ${details.discountDetails.amount}%`}
                  </dd>
                </dl>
              )}
            {details.taxDetails?.amount != undefined &&
              details.taxDetails?.amount > 0 && (
                <dl className="grid sm:grid-cols-5 gap-x-3">
                  <dt className="col-span-3 font-semibold text-gray-800">
                    Tax:
                  </dt>
                  <dd className="col-span-2 text-gray-500">
                    {details.taxDetails.amountType === "amount"
                      ? `+ ${details.taxDetails.amount} AED`
                      : `+ ${details.taxDetails.amount}%`}
                  </dd>
                </dl>
              )}
            {details.shippingDetails?.cost != undefined &&
              details.shippingDetails?.cost > 0 && (
                <dl className="grid sm:grid-cols-5 gap-x-3">
                  <dt className="col-span-3 font-semibold text-gray-800">
                    Shipping:
                  </dt>
                  <dd className="col-span-2 text-gray-500">
                    {details.shippingDetails.costType === "amount"
                      ? `+ ${details.shippingDetails.cost} AED`
                      : `+ ${details.shippingDetails.cost}%`}
                  </dd>
                </dl>
              )}
            <dl className="grid sm:grid-cols-5 gap-x-3">
              <dt className="col-span-3 font-semibold text-gray-800">Total:</dt>
              <dd className="col-span-2 text-gray-500">
                {formatNumberWithCommas(Number(details.totalAmount))} AED
              </dd>
            </dl>
            {details.totalAmountInWords && (
              <dl className="grid sm:grid-cols-5 gap-x-3">
                <dt className="col-span-3 font-semibold text-gray-800">
                  Total in words:
                </dt>
                <dd className="col-span-2 text-gray-500">
                  <em>{details.totalAmountInWords} AED</em>
                </dd>
              </dl>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="my-4">
          <div className="my-2">
            <p className="font-semibold text-blue-600">Additional notes:</p>
            <p className="font-regular text-gray-800">
              {details.additionalNotes}
            </p>
          </div>
          <div className="my-2">
            <p className="font-semibold text-blue-600">Payment terms:</p>
            <p className="font-regular text-gray-800">{details.paymentTerms}</p>
          </div>
          <div className="my-2">
            <span className="font-semibold text-md text-gray-800">
              Please send the payment to this address
              <p className="text-sm">
                Bank: {details.paymentInformation?.bankName}
              </p>
              <p className="text-sm">
                Account name: {details.paymentInformation?.accountName}
              </p>
              <p className="text-sm">
                Account no: {details.paymentInformation?.accountNumber}
              </p>
            </span>
          </div>
        </div>
        <p className="text-gray-500 text-sm">
          If you have any questions concerning this invoice, use the following
          contact information:
        </p>
        <div>
          <p className="block text-sm font-medium text-gray-800">
            {senderData.email}
          </p>
          <p className="block text-sm font-medium text-gray-800">
            {senderData.phone}
          </p>
        </div>
      </div>

      {/* Footer with Contact Bar */}
      <div className="mt-20">
        <div className="text-center">
          {/* Signature */}
          {details?.signature?.data && isDataUrl(details?.signature?.data) ? (
            <div className="mt-3 ml-[120px]">
              <img
                src={details.signature.data}
                width={120}
                height={60}
                alt={`Signature of ${senderData.name}`}
              />
            </div>
          ) : details.signature?.data ? (
            <div className="mt-6">
              <p
                style={{
                  fontSize: 30,
                  fontWeight: 400,
                  fontFamily: `${details.signature.fontFamily}, cursive`,
                  color: "black",
                }}
              >
                {details.signature.data}
              </p>
            </div>
          ) : null}
          <div className="flex justify-between">
            <p className="font-semibold text-gray-800">
              Receiver’s Sign _________________
            </p>
            <p className="font-semibold text-gray-800">for SPC SOURCE</p>
          </div>
        </div>
        <div className="mt-2 border-t border-gray-200 pt-4">
          <div className="w-full bg-orange-400 text-black p-2 flex justify-between items-center">
            <div className="flex items-center">
              <span className="mr-2">📧</span>
              <span>contact@spcsource.com</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">🌐</span>
              <span>www.spcsource.com</span>
            </div>
          </div>
        </div>
      </div>
    </InvoiceLayout>
  );
};

export default CustomTemplate;