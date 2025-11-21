import { useEffect, useState } from 'react'
import { getLoanHistory } from '../../api/ApiFunction'

function LoanHistory({ pan }) {

    const [historyData, setHistoryData] = useState([]);

    const history = async () => {
        const payload = {
            pan_number: pan
        }
        const response = await getLoanHistory(payload);
        if (response.status) {
            setHistoryData(response?.loanHistories);
        } else {
            toast.error(response.message);
        }
    };

    useEffect(() => {
        history();
    }, []);
    return (
        <div>
            {historyData?.length > 0 ? (
                <div className="w-full mt-5 overflow-x-auto">
                    <table className="min-w-max w-full border border-gray-300 bg-white shadow-md">
                        <thead>
                            <tr className="bg-gray-100 border-b">
                                <th className="border px-2 py-2 text-xs text-left">#</th>
                                <th className="border px-2 py-2 text-xs text-left">Loan ID</th>
                                <th className="border px-2 py-2 text-xs text-left">Loan Amount</th>
                                <th className="border px-2 py-2 text-xs text-left">Due Date</th>
                                <th className="border px-2 py-2 text-xs text-left">Status</th>
                                <th className="border px-2 py-2 text-xs text-left">Closed Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyData?.map((item, index) => (
                                <tr key={index} className="border-b">
                                    <td className="border px-2 py-2 text-xs">{index + 1}</td>
                                    <td className="border px-2 py-2 text-xs">{item.loan_id}</td>
                                    <td className="border px-2 py-2 text-xs">{item.loan_amount}</td>
                                    <td className="border px-2 py-2 text-xs">{item.due_date}</td>
                                    <td className="border px-2 py-2 text-xs">{item.loan_status}</td>
                                    <td className="border px-2 py-2 text-xs">{item.loan_closed_date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="w-full mt-5 overflow-x-auto">
                    <h1 className="text-center">No History Found</h1>
                </div>
            )}
        </div>
    )
}
export default LoanHistory