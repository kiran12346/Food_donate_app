import React, { useState, useEffect } from 'react';
import { getDatabase, ref, push, set, onValue } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import DonationHeader from "./DonationHeader"
import Footer from '../../Footer/footer'
import '../../css/RequestForm.css';
import "../../css/donationHeader.css"
import "../../css/Request.css"

const RequestListing = ({ dashboardView, handleLocationClick }) => {
    const [showForm, setShowForm] = useState(false);
    const [userName, setUserName] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        expirationDate: '',
        foodType: '',
        foodQuantity: '',
        foodWeight: '',
        pickupDateTime: '',
    });
    const [tableData, setTableData] = useState([]);
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);

    useEffect(() => {
        const db = getDatabase();
        const requestsRef = ref(db, 'donationRequests');

        // Fetch data from Firebase on component mount
        onValue(requestsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const requestsArray = Object.entries(data).map(([requestId, requestData]) => ({
                    requestId,
                    ...requestData
                }));

                // Apply filter based on status
                const filteredRequests = requestsArray.filter(request => request.status !== "received");

                console.log("Filtered Requests:", filteredRequests);

                setTableData(dashboardView ? filteredRequests.slice(-5) : requestsArray);
            }
        });
    }, [dashboardView]);

    useEffect(() => {
        // Listen for changes in authentication state
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                const db = getDatabase();
                const userRef = ref(db, `users/${user.uid}`);
                onValue(userRef, (snapshot) => {
                    const userData = snapshot.val();
                    console.log(userData);
                    if (userData && userData.account_type) {
                        setUserRole(userData.account_type);
                        setUserName(capitalizeFirstLetter(userData.first_name));
                    }
                });
            } else {
                setUserId(null);
                setUserRole(null);
            }
        });

        return () => unsubscribe();
    }, []);

    function capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    const getStatusButtonText = (status) => {
        console.log(status);
        switch (status) {
            case "pending":
                return "Pending";
            case "received":
                return <span style={{ color: 'green' }}>Received</span>;
            case "deliver":
                return "To Deliver";
            default:
                return "Unknown Status";
        }
    };

    const handleAccept = (requestId) => {
        if (userRole === "volunteer") {
            const db = getDatabase();
            const requestRef = ref(db, `donationRequests/${requestId}`);

            set(requestRef, {
                ...tableData.find(data => data.requestId === requestId),
                status: "pending",
                deliveredBy: userId, // Save the user ID of the volunteer who accepted
            })
                .then(() => {
                    const updatedTableData = tableData.map((data) => {
                        if (data.requestId === requestId) {
                            return { ...data, status: "pending", deliveredBy: userId };
                        }
                        return data;
                    });

                    setTableData(updatedTableData);
                })
                .catch((error) => {
                    console.error("Error updating status:", error);
                });
        }
    };

    const handlePending = (requestId, status) => {
        console.log('handlePending function called');
        if (userRole === "recipient" && status === "pending") {
            const db = getDatabase();
            const requestRef = ref(db, `donationRequests/${requestId}`);

            // Update the status to "received" in the database
            set(requestRef, {
                ...tableData.find(data => data.requestId === requestId),
                status: "received",
                receivedBy: userId, // Save the user ID of the recipient
            })
                .then(() => {
                    // Remove the item from the local state only if it is a dashboard view
                    if (dashboardView) {
                        const updatedTableData = tableData.filter((data) => data.requestId !== requestId);
                        setTableData(updatedTableData);
                    }

                    alert("Delivery received! Status updated to received.");
                })
                .catch((error) => {
                    console.error("Error updating status:", error);
                });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'location') {
            const [lan, lng] = value.split(',').map(coord => coord.trim());
            setFormData(prevData => ({
                ...prevData,
                location: { lan, lng },
            }));
            setCurrentLocation({ lan, lng });
            console.log(lan, lng);
        } else {
            setFormData(prevData => ({
                ...prevData,
                [name]: value,
            }));
        }
    };
 
    const handleShowLocation = (lan, lng) => {
        // Open Google Maps with the specified location
        if (!dashboardView) {
            window.open(`https://www.google.com/maps?q=${lan},${lng}`, '_blank');
        }
        // handleLocationClick(lan, lng);
    };
    
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        const db = getDatabase();
        const requestsRef = ref(db, 'donationRequests');

        // Add the new data to the 'requests' node in Firebase
        const newRequestRef = push(requestsRef);
        const currentTime = new Date();
        set(newRequestRef, {
            ...formData,
            userId: userId,
            userRole: userRole,
            donatedBy: userId,
            deliveredBy: "",
            receivedBy: "",
            status: "deliver",
            time: currentTime.toISOString(),
        });

        // Reset the form data and hide the form
        setFormData({
            title: '',
            description: '',
            location: '',
            expirationDate: '',
            foodType: '',
            foodQuantity: '',
            foodWeight: '',
            pickupDateTime: '',
        });
        setShowForm(false);
    };

    const columnsForDashboard = [
        'title',
        'description',
        'foodType',
        'pickupDateTime',
    ];

    const columnsForDonationsPage = [
        'title',
        'description',
        'expirationDate',
        'foodType',
        'foodQuantity',
        'foodWeight',
        'pickupDateTime',
    ];

    const displayedColumns = dashboardView ? columnsForDashboard : columnsForDonationsPage;

    return (
        <div className="container-fluid pb-3">
            <div className="row">
                {!dashboardView && <DonationHeader />}
                <div className={'col-md-12 pt-3'}>
                    {dashboardView && (
                        <h5 className="title mb-3 text-secondary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Donation Requests
                            {userRole === "donor" && (
                                <button
                                    className="btn btn-primary mb-3 mt-3"
                                    onClick={() => setShowForm(true)}
                                >
                                    Donate
                                </button>
                            )}
                        </h5>
                    )}
                    {showForm && (
                        <div className="form-popup">
                            <div className="form-container">
                                <form className="row g-3" onSubmit={handleFormSubmit}>
                                    <div className="col-md-6">
                                        <label htmlFor="inputTitle" className="form-label">Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            placeholder="Enter a title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            required
                                            className='form-control'
                                        />

                                        <label htmlFor="inputExpirationDate" className="form-label mb-1 mt-2">Expiration Date</label>
                                        <input
                                            type="date"
                                            name="expirationDate"
                                            value={formData.expirationDate}
                                            onChange={handleInputChange}
                                            className='form-control'
                                        />

                                        <label htmlFor="inputFoodType" className="form-label mb-1 mt-2">Food Type</label>
                                        <select
                                            name="foodType"
                                            required
                                            value={formData.foodType}
                                            onChange={handleInputChange}
                                            className='form-control'
                                        >
                                            <option value="" disabled hidden>Select a food type</option>
                                            <option value="Canned Goods">Canned Goods</option>
                                            <option value="Fresh Produce">Fresh Produce</option>
                                            <option value="Packaged Meals">Packaged Meals</option>
                                            <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                                            <option value="Non-Perishable Items">Non-Perishable Items</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="inputDescription" className="form-label">Description</label>
                                        <textarea
                                            name="description"
                                            placeholder="Enter a description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            required
                                            className='form-control'
                                            style={{ textAlign: 'left', verticalAlign: 'middle' }}
                                        ></textarea>

                                        <label htmlFor="inputQuantity" className="form-label mb-1 mt-2">Quantity</label>
                                        <input
                                            type="text"
                                            name="foodQuantity"
                                            placeholder="Enter the quantity"
                                            value={formData.foodQuantity}
                                            onChange={handleInputChange}
                                            className='form-control'
                                        />

                                        <label htmlFor="inputWeight" className="form-label mb-1 mt-2">Weight</label>
                                        <input
                                            type="text"
                                            name="foodWeight"
                                            placeholder="Enter the weight"
                                            value={formData.foodWeight}
                                            onChange={handleInputChange}
                                            className='form-control'
                                        />
                                    </div>
                                    <div className="col-md-12">
                                        <label htmlFor="inputPickupDateTime" className="form-label mb-1 mt-2">Pickup Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            name="pickupDateTime"
                                            value={formData.pickupDateTime}
                                            onChange={handleInputChange}
                                            required
                                            className='form-control'
                                        />
                                    </div>
                                    <div className="col-md-12">
                                        <label htmlFor="inputLocation" className="form-label mb-1 mt-2">Location (Latitude, Longitude)</label>
                                        <input
                                            type="text"
                                            name="location"
                                            placeholder="Enter the location coordinates"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            required
                                            className='form-control'
                                        />
                                    </div>
                                    <div className="col-12 mt-3">
                                        <button
                                            type="submit"
                                            className="btn btn-primary btn-block"
                                        >
                                            Submit
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-block"
                                            onClick={() => setShowForm(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                    <div className="table-responsive">
                        <table className="table table-bordered table-hover">
                            <thead>
                                <tr>
                                    {displayedColumns.map((column, index) => (
                                        <th key={index} style={{ textAlign: 'center' }}>
                                            {column.charAt(0).toUpperCase() + column.slice(1)}
                                        </th>
                                    ))}
                                    <th style={{ textAlign: 'center' }}>Location</th>
                                    <th style={{ textAlign: 'center' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.map((request, index) => (
                                    <tr key={index}>
                                        {displayedColumns.map((column, colIndex) => (
                                            <td key={colIndex} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                {request[column]}
                                            </td>
                                        ))}
                                        <td style={{ textAlign: 'center' }}>
                                            {request.location ? (
                                                <button
                                                    className="btn btn-link"
                                                    onClick={() => handleShowLocation(request.location.lan, request.location.lng)}
                                                >
                                                    Show Location
                                                </button>
                                            ) : (
                                                "N/A"
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {getStatusButtonText(request.status)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
            <Footer />
        </div>
    );
};

export default RequestListing;
