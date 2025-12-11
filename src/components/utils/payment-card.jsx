import { useEffect, useState } from "react"
import Icon from "./Icon"
import { CreatePaymentLink } from "../../api/Api_call"
import { useUserInfoContext } from "../context/UserInfoContext"
import Loader from "./Loader"

const PaymentCard = ({ emiData }) => {
    const [isPaying, setIsPaying] = useState(false)
    const [loading, setLoading] = useState(false)
    const [payInfo, setPayInfo] = useState({})
    const [isSuccess, setIsSuccess] = useState(false)

    const { userInfo } = useUserInfoContext();

    // alert(JSON.stringify(userInfo, null, 2))

    const isOverdue = emiData?.due_status === "Overdue"

    const formattedAmount = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(emiData.totalEmiToPay)

    const handlePayment = async () => {
        setLoading(true);

        const request = {
            amount: emiData.totalEmiToPay,
            reference_id: userInfo?.lead_id,
            description: "EMI Payment",
            customer: {
                name: userInfo?.personalInfo[0]?.full_name,
                contact: userInfo?.mobile_number,
                email: userInfo?.personalInfo[0]?.email_id,
            },
            notify: {
                sms: true,
                email: true
            },
            options: {
                checkout: {
                    name: import.meta.env.VITE_FULL_PRODUCT_NAME
                }
            },
            notes: {
                policy_name: userInfo?.lead_id + "-" + userInfo?.user_id + "-" + userInfo?.personalInfo[0]?.full_name
            },
            callback_url: import.meta.env.VITE_RAZORPAY_BACKURL,
            company_id: import.meta.env.VITE_COMPANY_ID,
            product_name: import.meta.env.VITE_PRODUCT_NAME
        };

        try {
            const response = await CreatePaymentLink(request);

            if (response.status) {
                setPayInfo(response.data);
            } else {
                toast.error(response.message);
                setLoading(false); // stop loader if there's an error
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("An error occurred while fetching data.");
            setLoading(false); // stop loader on catch
        }
    };

    // useEffect to redirect when payInfo is set
    useEffect(() => {
        if (payInfo?.short_url) {
            setLoading(true);
            // Optional delay if you want loader to show for a moment
            setTimeout(() => {
                window.location.replace(payInfo.short_url);
            }, 500);
        }
    }, [payInfo]);

    // Show loader while loading is true
    if (loading) return <Loader />;


    return (
        <div
            className={`w-full max-w-md rounded-xl shadow-lg overflow-hidden ${isOverdue ? "bg-gradient-to-r from-rose-50 to-rose-100" : "bg-white"
                }`}
        >
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">EMI Payment</h3>
                    </div>
                    <div
                        className={`px-3 py-1 rounded-full text-sm font-medium shadow ${isOverdue ? "bg-rose-100 text-red-500" : "bg-green-200 text-green-500 px-5"}`}
                    >
                        {emiData.due_status}
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 font-bold">Amount Due</span>
                        <span className="text-2xl font-bold text-gray-900">{formattedAmount}</span>
                    </div>

                    <div className="flex items-center mt-4 text-sm">
                        <Icon name={"MdOutlineCalendarToday"} size={20} />
                        <span className={`${isOverdue ? "text-rose-600 font-medium ml-2" : "text-gray-600"}`}>
                            Due Date: {emiData.due_date}
                        </span>
                    </div>

                    {isOverdue && (
                        <div className="flex items-center mt-2 text-sm">
                            <Icon name={"IoAlertCircleOutline"} size={20} />
                            <span className={`${isOverdue ? "text-rose-600 font-medium ml-2" : "text-gray-600"}`}>
                                Days Past Due: {emiData.days_past_due}
                            </span>
                        </div>
                    )}

                    {(emiData.dpd_interest > 0 || emiData.penal_charge > 0) && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Additional Charges</h4>
                            {emiData.dpd_interest > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Interest</span>
                                    <span>₹{emiData.dpd_interest}</span>
                                </div>
                            )}
                            {emiData.penal_charge > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Penalty</span>
                                    <span>₹{emiData.penal_charge}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="px-6 pb-6">
                <button
                    onClick={handlePayment}
                    disabled={isPaying}
                    className={`w-full py-1.5 px-4 rounded-lg font-medium text-white transition-all ${isOverdue ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"
                        } ${isPaying ? "opacity-75 cursor-not-allowed" : ""}`}
                >
                    {isPaying ? "Processing..." : "Pay Now"}
                </button>
            </div>
        </div>
    )
}

export default PaymentCard
