import { useState, useEffect } from "react";
import { registerEMandate, getTokenPostEmandate } from "../../api/Api_call";
import Loader from "../../components/utils/Loader";
import Button from "../../components/utils/Button";
import Images from "../../components/content/Images";
import { useUserInfoContext } from "../../components/context/UserInfoContext";
import Card from "../../components/utils/Card";

function RegisterNach() {

    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [regData, setRegData] = useState([]);
    const [nachData, setNachData] = useState([]);
    const [token, setToken] = useState('');

    const { userInfo, setUserInfo } = useUserInfoContext();



    // const updateData = () => {
    //     setTimeout(() => {
    //         setUserInfo((userInfo) => ({
    //             ...userInfo,
    //             is_e_nach_activate: true,
    //         }));
    //     }, 5000);
    // };

    const registerNACH = async () => {
        setLoading(true);
        const req = {
            name: userInfo?.personalInfo[0]?.full_name,
            email: userInfo?.personalInfo[0]?.email_id,
            contact: userInfo?.mobile_number,
            // amount: import.meta.env.VITE_NACH_REGISTER_AMOUN,
            amount: 1,
            receipt: "Detail of Emaindate Text Free Flow",
            currenc: import.meta.env.VITE_NACH_REGISTER_AMOUNT,
            order_notes: {
                notes_key_1: "Emandate Register Request",
                notes_key_2: "Paisa Udhaar Mandate"
            },
            customer_notes: {
                notes_key_1: userInfo?.personalInfo[0]?.full_name + "-" + userInfo?.mobile_number,
                notes_key_2: userInfo?.lead_id + "-" + userInfo?.user_id
            },
            company_id: import.meta.env.VITE_COMPANY_ID,
            product_name: import.meta.env.VITE_PRODUCT_NAME
        }
        try {
            const response = await registerEMandate(req);
            // console.log("API Response:", response);

            if (response.status) {
                setRegData(response.data);
                setLoading(false);
            } else {
                console.log(response.message);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
        setLoading(false);
    }

    useEffect(() => {
        if (regData?.order_id) {
            handlePayment();
        }
    }, [regData.order_id]);


    useEffect(() => {
        const script = document.createElement("script");
        script.src = import.meta.env.VITE_RAZORPAY_CHECKOUT_URL;
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Get Token Post Emandate
    const tokenPostEmandate = async () => {
        if (!nachData?.razorpay_payment_id) return;

        const req = {
            lead_id: userInfo?.lead_id,
            payment_id: nachData.razorpay_payment_id,
            order_id: nachData.razorpay_order_id,
            signature: nachData.razorpay_signature,
            company_id: import.meta.env.VITE_COMPANY_ID,
            product_name: import.meta.env.VITE_PRODUCT_NAME
        };

        try {
            setLoading(true);
            const response = await getTokenPostEmandate(req);
            setToken(response.token_data);
        } catch (error) {
            console.error("Get Token Post Emandate:", error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (nachData) {
            tokenPostEmandate();
        }
    }, [nachData]);

    const handlePayment = () => {
        if (!regData?.key || !regData?.order_id || !regData?.customer_id) {
            console.error("Missing required payment regData.");
            return;
        }

        const options = {
            key: regData.key,
            order_id: regData.order_id,
            customer_id: regData.customer_id,
            recurring: "1",
            handler: (response) => {
                setNachData(response);
                // console.log("Payment Response:", response);
            },
            notes: {
                "note_key 1": "Payment for Emandate Registration",
                "note_key 2": "Paisa Udhaar Mandate."
            },
            theme: {
                color: "#5484f3"
            }
        };
        const rzp1 = new window.Razorpay(options);
        rzp1.open();
    };

    useEffect(() => {
        if (token === "") return;

        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        const redirectTimer = setTimeout(() => {
            setUserInfo((userInfo) => ({
                ...userInfo,
                is_e_nach_activate: true,
            }));
        }, 5000);

        return () => {
            clearInterval(timer);
            clearTimeout(redirectTimer);
        };
    }, [token]);



    if (loading) return <Loader msg="Please Wait..." />;

    return (
        <>
            {token === "" && (
                <Card heading="Register eMandate" style="bg-white" >
                    <div>
                        <div className="flex justify-center">
                            <p className="text-sm text-center text-gray-600">
                                Please continue to register your eMandate & keep your Bank Account, Debit Card details handy for hassle-free process.
                            </p>
                        </div>
                        <div>
                            <div className="flex justify-center items-center my-5">
                                <img src={Images.nach} alt="QR Code" className="h-36" />
                            </div>
                            <div className="flex justify-center items-center my-5">
                                <Button
                                    btnName={"Register eMandate"}
                                    style={"bg-primary text-white px-4 py-2 hover:bg-secondary hover:text-black"}
                                    onClick={registerNACH}
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {token && (
                <div>
                    <div className="flex justify-center" >
                        <img src={Images.verified} alt="success" className="h-24" />
                    </div>
                    <h1 className="text-center text-primary font-bold text-lg mt-5">eMandate Registered</h1>
                    {/* <h1 className="text-center text-gray-400 font-bold text-sm"> {token.token}</h1> */}

                    <div className="my-3">
                        <p className="text-center text-gray-800">
                            Redirecting in <span className="text-primary font-bold">{countdown}</span> seconds...
                        </p>
                    </div>
                </div>
            )}
        </>
    )
}
export default RegisterNach