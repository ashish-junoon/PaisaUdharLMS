import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import AppStatus from '../../components/utils/AppStatus';
import AppCard from '../../components/form/AppCard';
import KYCStatusCard from '../../components/form/KYCStatusCard';
import { getLeadDetails, UpdateUserLead, UpdateMenualNACH } from '../../api/ApiFunction';
import SelectInput from '../../components/fields/SelectInput';
import TextInput from '../../components/fields/TextInput';
import { eKYCRemarks } from '../../components/content/Data';
import Button from '../../components/utils/Button';
import Modal from '../../components/utils/Modal';
import ErrorMsg from '../../components/utils/ErrorMsg';
import Loader from '../../components/utils/Loader';
import { useAuth } from '../../context/AuthContext';
import { useOpenLeadContext } from '../../context/OpenLeadContext';
import { Helmet } from 'react-helmet';
import TabWrap from '../../components/utils/TabWrap';
import FormSidebar from '../../components/form/FormSidebar';
import LeadHistory from '../../components/utils/LeadHistory';
import Personal from '../../components/form/Personal';
import Employment from '../../components/form/Employment';
import Address from '../../components/form/Address';
import KycInfo from '../../components/form/KycInfo';
import Gaurantor from '../../components/form/Gaurantor';
import BankInfo from '../../components/form/BankInfo';
import SelectedLoan from '../../components/form/SelectedLoan';
import OthersDocs from '../../components/form/OthersDocs';
import LoginPageFinder from '../../components/utils/LoginPageFinder';
import LoanHistory from '../../components/utils/LoanHistory';

const LeadKYCForm = () => {
    const [openApporve, setOpenApporve] = useState(false);
    const [openReject, setOpenRejcet] = useState(false);
    const location = useLocation();
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNachOpen, setIsNachOpen] = useState(false);
    const lead_id = location.state?.lead_id;
    const user_id = location.state?.user_id;

    const navigate = useNavigate();
    const { setLeadInfo } = useOpenLeadContext();
    const { adminUser } = useAuth();

    const pageAccess = LoginPageFinder('page_display_name', 'leads in kyc');
    const permission = pageAccess?.[0].read_write_permission;
    const funder = adminUser.role === 'Funder' ? true : false

    useEffect(() => {
        if (lead_id && user_id) {
            fetchData();
        } else {
            navigate("/")
        }
    }, [lead_id, user_id]);

    const confirmLead = async (req) => {
        try {
            const response = await UpdateUserLead(req);
            console.log("API Response:", response); // Debug log

            if (response.status) {
                toast.success(response.message);
                navigate("/manage-leads/leads-in-kyc");
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("An error occurred while fetching data.");
        }
    };


    const fetchData = async () => {
        setIsLoading(true);
        const req = {
            lead_id: lead_id,
            user_id: user_id,
            login_user: adminUser.emp_code,
            permission: "w"
        };
        try {
            const response = await getLeadDetails(req);
            if (response.status) {
                setUserData(response);
                setLeadInfo(response);
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("An error occurred while fetching data.");
        } finally {
            setIsLoading(false);
        }
    };

    const formik = useFormik({
        initialValues: {
            reason: '',
            remarks: ''
        },
        validationSchema: Yup.object({
            reason: Yup.string().required('Bank name is required.'),
            remarks: Yup.string().required('Bank name is required.'),
        }),
        onSubmit: async (values) => {
            const req = {
                lead_id: lead_id,
                step_status: 7, //Rejected status
                is_prove: false,
                updated_by: adminUser.emp_code,
                reason: formik.values.reason,
                remarks: formik.values.remarks
            };

            confirmLead(req);
            console.log("values:", req);
            setOpenRejcet(!openReject);
            // toast.success('Application Rejected');

        },
    });


    //Activate Nach function
    const activateNach = useFormik({
        initialValues: {
            customerId: '',
            tokenId: ''
        },
        validationSchema: Yup.object({
            customerId: Yup.string()
                .required('Customer ID is required.')
                .matches(/^cust_/, 'Must start with "cust_".'),

            tokenId: Yup.string()
                .required('Token ID is required.')
                .matches(/^token_/, 'Must start with "token_".'),
        }),
        onSubmit: async (values) => {
            const req = {
                lead_id: lead_id,
                customer_id: values.customerId,
                token_id: values.tokenId
            };

            try {
                const response = await UpdateMenualNACH(req);
                if (response.status) {
                    setLeadInfo(prev => ({
                        ...prev,
                        is_e_nach_activate: true,
                    }));
                    setIsNachOpen(false);
                    toast.success(response.message);
                } else {
                    toast.error(response.message);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("An error occurred while fetching data.");
            }
            setIsNachOpen(false);
        },
    });

    // const handleNachOpen = () => {
    //     setIsNachOpen(true);
    // };


    // handle Approve confirm Yes button
    const handleApproveYes = () => {
        const { is_e_kyc_done, is_e_nach_activate, is_loan_consent } = userData;

        if (!is_e_kyc_done || !is_e_nach_activate || !is_loan_consent) {
            toast.error('Wait for applicant to complete application.');
            return;
        }

        const req = {
            lead_id,
            step_status: 5,
            is_prove: true,
            updated_by: adminUser.emp_code,
            reason: "eKYC Done",
            remarks: "eKYC, eMandate complete. Loan applied, sent for disbursal."
        };

        confirmLead(req);
        setOpenApporve(false);  // Close modal after approval
        navigate("/manage-leads/leads-in-kyc");
    };


    //handle Approve confirm No button
    const handleApproveNo = () => {
        setOpenApporve(!openApporve);
    }


    // handle Reject lead No button
    const handleRejectNo = () => {
        setOpenRejcet(!openReject);
    };

    if (isLoading) {
        return <Loader />;
    }

    if (!userData) {
        return <div>No data available</div>;
    }


    const tabData = [
        {
            label: 'Application Status',
            content: <div div className='my-8' >
                <KYCStatusCard />
                <div className='mt-5 w-10/12 mx-auto'>
                    <div className='grid grid-cols-2 gap-4'>
                        <div className=''>
                            <SelectedLoan />
                        </div>
                        {permission && userData?.is_e_nach_activate === false &&
                            <div className=''>
                                <div className='flex justify-end'>
                                    <Button
                                        btnName={"Update e-NACH Token"}
                                        btnIcon={"MdAutoMode"}
                                        type={""}
                                        onClick={() => setIsNachOpen(!isNachOpen)}
                                        style="min-w-[150px] bg-primary text-white font-medium py-2 px-4 rounded"
                                    />
                                </div>
                            </div>
                        }

                    </div>
                </div>
            </div >
        },
        {
            label: 'Borrower Application',
            content: <div className='grid grid-cols-7 gap-4 mt-5'>
                <div className='col-span-2 py-5'>
                    <div>
                        {!funder && <FormSidebar data={userData} />}
                    </div>
                </div>
                <div className={`${!funder ? 'col-span-5' : 'col-span-7'} py-5`}>
                    <div className='px-5'>
                        <Personal />
                        <Employment />
                        <Address />
                        <KycInfo />
                        <BankInfo btnEnable={true} />
                        <Gaurantor btnEnable={true} />
                        <OthersDocs btnEnable={true} />
                    </div>
                </div>
            </div>
        },
        {
            label: 'Lead Remarks',
            content: <div className='mb-5'>
                <LeadHistory data={userData} btnEnable={permission} />
            </div>
        },
        {
            label: 'Loan History',
            content: <div className='mb-5'>
                <LoanHistory pan={userData?.kycInfo[0]?.pan_card_number} />
            </div>
        },
    ];

    return (
        <>
            <Helmet>
                <title>Leads eKYC</title>
                <meta name="Leads Verification" content="Leads Verification" />
            </Helmet>
            <div>
                <AppStatus
                    appStatus={userData?.lead_status}
                    rejectedStatus={false}
                />
                <AppCard
                    data={userData}
                />
            </div>
            <div className='mt-4'>
                <TabWrap tabData={tabData} />
            </div>
            {permission && userData?.lead_status === 4 && (
                <div className='flex justify-end gap-5 mt-5'>
                    <Button
                        btnName={"Mark as Approved"}
                        btnIcon={"IoCloseCircleOutline"}
                        type={""}
                        disabled={false}
                        onClick={() => setOpenApporve(!openApporve)}
                        style="min-w-[150px] text-sm italic font-semibold md:w-auto my-4 py-1 border-success px-4 text-white bg-success border hover:border-success text-primary hover:bg-white hover:text-success"
                    />

                    <Button
                        btnName={"Mark as Rejected"}
                        btnIcon={"IoCloseCircleOutline"}
                        type={""}
                        onClick={() => setOpenRejcet(!openReject)}
                        style="min-w-[150px] text-sm italic font-semibold md:w-auto my-4 py-1 px-4 border border-danger text-danger bg-white hover:border-danger hover:bg-danger hover:text-white"
                    />
                </div>
            )}

            {/* Approve Modal */}
            <Modal
                isOpen={openApporve}
                onClose={() => setOpenApporve(false)}
            >
                <div className='text-center font-semibold'>
                    <h1>Are you sure you want to approve?</h1>
                </div>
                <div className="flex justify-end gap-4 mt-2">
                    <Button
                        btnName="YES"
                        btnIcon="IoCheckmarkCircleSharp"
                        type="submit"
                        onClick={handleApproveYes}
                        style="min-w-[80px] text-sm italic my-4 font-semibold md:w-auto py-1 border-success px-4 text-white bg-success border hover:border-success text-primary hover:bg-white hover:text-success hover:font-bold"
                    />
                    <Button
                        btnName={"NO"}
                        btnIcon={"IoCloseCircleOutline"}
                        type={"button"}
                        onClick={handleApproveNo}
                        style="min-w-[80px] text-sm italic font-semibold md:w-auto my-4 py-1 px-4 border border-primary text-primary hover:border-danger hover:text-danger hover:font-bold"
                    />
                </div>

            </Modal >
            {/* Reject Modal */}
            <Modal Modal
                isOpen={openReject}
                onClose={() => setOpenRejcet(false)}
                heading={"Reject Lead"}
            >
                <div className='px-5'>
                    <form onSubmit={formik.handleSubmit} className='my-4'>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <SelectInput
                                    label="Rejection Reason"
                                    placeholder="Select"
                                    icon="RiDraftLine"
                                    name="reason"
                                    id="reason"
                                    options={eKYCRemarks}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.reason}
                                />
                                {formik.touched.reason && formik.errors.reason && (
                                    <ErrorMsg error={formik.errors.reason} />
                                )}
                            </div>
                            <div className="col-span-2">
                                <TextInput
                                    label="Remarks"
                                    icon="GoPencil"
                                    placeholder="Write Remarks"
                                    name="remarks"
                                    id="remarks"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.remarks}
                                />
                                {formik.touched.remarks && formik.errors.remarks && (
                                    <ErrorMsg error={formik.errors.remarks} />
                                )}
                            </div>


                        </div>
                        <div className="flex justify-end gap-4 mt-2">
                            <Button
                                btnName="Reject"
                                btnIcon="IoCheckmarkCircleSharp"
                                type="submit"
                                style="min-w-[80px] text-sm italic my-4 font-semibold md:w-auto py-1 border-success px-4 text-white bg-success border hover:border-success text-primary hover:bg-white hover:text-success"
                            />
                            <Button
                                btnName={"Cancel"}
                                btnIcon={"IoCloseCircleOutline"}
                                type={"button"}
                                onClick={handleRejectNo}
                                style="min-w-[80px] text-sm italic font-semibold md:w-auto my-4 py-1 px-4 border border-danger text-danger hover:bg-danger hover:text-white"
                            />
                        </div>

                    </form>
                </div>

            </Modal >

            {/* Update Nach Modal */}
            <Modal Modal
                isOpen={isNachOpen}
                onClose={() => setIsNachOpen(false)}
                heading={"Update eNACH Token"}
            >
                <div className='px-5'>
                    <form onSubmit={activateNach.handleSubmit} className='my-4'>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <TextInput
                                    label="Customer ID"
                                    icon="IoPersonOutline"
                                    placeholder="cust_QVtdI1U8xPGPMH"
                                    name="customerId"
                                    id="customerId"
                                    maxLength={25}
                                    onChange={activateNach.handleChange}
                                    onBlur={activateNach.handleBlur}
                                    value={activateNach.values.customerId}
                                />
                                {activateNach.touched.customerId && activateNach.errors.customerId && (
                                    <ErrorMsg error={activateNach.errors.customerId} />
                                )}
                            </div>
                            <div className="col-span-2">
                                <TextInput
                                    label="Token ID"
                                    icon="IoPersonOutline"
                                    placeholder="token_QVtzGtj2FDJWvJ"
                                    name="tokenId"
                                    maxLength={25}
                                    id="tokenId"
                                    onChange={activateNach.handleChange}
                                    onBlur={activateNach.handleBlur}
                                    value={activateNach.values.tokenId}
                                />
                                {activateNach.touched.tokenId && activateNach.errors.tokenId && (
                                    <ErrorMsg error={activateNach.errors.tokenId} />
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 mt-2">
                            <Button
                                btnName="Update"
                                btnIcon="IoCheckmarkCircleSharp"
                                type="submit"
                                style="min-w-[80px] text-sm italic my-4 font-semibold md:w-auto py-1 border-primary px-4 text-white bg-primary border hover:border-primary text-white  hover:bg-white hover:text-primary"
                            />
                            <Button
                                btnName={"Close"}
                                btnIcon={"IoCloseCircleOutline"}
                                type={"button"}
                                onClick={() => setIsNachOpen(false)}
                                style="min-w-[100px] text-sm italic font-semibold md:w-auto my-4 py-1 px-4 border border-primary text-primary hover:border-danger hover:text-danger"
                            />
                        </div>

                    </form>
                </div>

            </Modal >
        </>
    );
};

export default LeadKYCForm;