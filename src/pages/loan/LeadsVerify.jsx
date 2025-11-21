// pages/LeadsPage.jsx
import React, { useState, useEffect } from 'react';
import Table from '../../components/Table';
import { toast } from 'react-toastify';
import Icon from '../../components/utils/Icon';
import { useNavigate } from 'react-router-dom';
import { getAllLeads } from '../../api/ApiFunction';
import { Helmet } from 'react-helmet';
import Loader from '../../components/utils/Loader';
import LoginPageFinder from '../../components/utils/LoginPageFinder';
import { maskData } from '../../components/utils/maskData';
import { useAuth } from '../../context/AuthContext';

const LeadsVerify = () => {
    const [tableData, setTableData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const { adminUser } = useAuth();

    const dateToday = new Date(new Date().setDate(new Date().getDate() - 0)).toISOString().split("T")[0];
    const preTenDay = new Date(new Date().setDate(new Date().getDate() - 60)).toISOString().split("T")[0];

    const pageAccess = LoginPageFinder('page_display_name', 'leads verification');
    const permission = pageAccess?.[0].read_write_permission;
    const funder = adminUser.role === 'Funder' ? true : false

    // alert(JSON.stringify(pageAccess));

    useEffect(() => {
        const fetchData = async () => {
            const req = {
                status: "2",
                from_date: preTenDay,
                to_date: dateToday,
                branch: "",
                source: ""
            };
            try {
                setIsLoading(true);
                const response = await getAllLeads(req);
                // console.log("API Response:", response); // Debug log

                if (response.status) {
                    const transformedData = response.userleadlist.map((user, index) => ({
                        ...user, // Keep all original fields
                        serialNumber: index + 1, // Add a serial number if needed
                    }));

                    // console.log("Transformed Data:", transformedData); // Debug log
                    setTableData(transformedData);
                    setIsLoading(false);
                } else {
                    toast.error(response.message);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("An error occurred while fetching data.");
            }
            setIsLoading(false);
        };

        fetchData();
    }, []);


    const columnsData = [
        {
            name: 'Lead ID',
            selector: row => row.lead_id,
            sortable: true,
            width: '100px'
        },
        {
            name: 'Lead Date',
            selector: row => row.created_date,
            sortable: true,
            width: '120px'
        },
        {
            name: 'Full Name',
            selector: row => row.full_name,
            sortable: true,
            // width: '250px'
        },
        {
            name: 'Gender',
            selector: row => row.gender,
            sortable: true,
            width: '100px'
        },
        {
            name: 'Mobile No',
            selector: row => funder ? maskData(row.mobile_number, 'mobile') : row.mobile_number,
            width: '150px'
        },
        {
            name: 'Salary',
            selector: row => row.net_monthly_salary,
            width: '100px'
        },
        {
            name: 'State',
            selector: row => row.state,
            sortable: true,
            width: '120px'
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            width: '120px',
            cell: row => {
                if (row.status.toString() === '2') {
                    return <span className="text-success font-bold text-[10px] border border-success px-2 py-0.5 rounded-full shadow-md italic">In-Process</span>;
                } else {
                    return <span className="text-danger font-bold text-[10px] border border-danger px-2 py-0.5 rounded-full shadow-md italicl">N/A</span>;
                }
            }
        },
        {
            name: 'Actions',
            cell: row => (
                <button
                    onClick={() => navigate('/lead/lead-verify', {
                        state: { lead_id: row.lead_id, user_id: row.user_id }
                    })}
                    className="p-2 hover:text-secondary"
                >
                    <Icon name="MdOutlineRemoveRedEye" size={21} />
                </button>
            ),
            ignoreRowClick: true,
            allowoverflow: true,
            button: 'true',
        },
        {
            name: 'Last Action',
            selector: row => row.last_action_date || 'N/A',
            width: '150px'
        },
    ];

    const handleFilterBtn = () => {
        toast.info("No filter available for this page.");
    };

    if (isLoading) return <Loader />;

    return (
        <>
            <Helmet>
                <title>Leads Verification</title>
                <meta name="Leads Verification" content="Leads Verification" />
            </Helmet>

            <div className='mt-8'>
                <Table
                    columns={columnsData}
                    data={tableData}
                    title="Leads Verification"
                    handleFilter={handleFilterBtn}
                    exportable={permission}
                />
            </div>
        </>
    );
};

export default LeadsVerify;
