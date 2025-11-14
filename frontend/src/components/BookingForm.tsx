import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Calendar, Clock, Loader } from 'lucide-react';

interface BookingData {
  name: string;
  email: string;
  phone: string;
  bookingType: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  reason?: string;
  image: File | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const BookingForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<BookingData>({
    name: '',
    email: '',
    phone: '',
    bookingType: '',
    date: '',
    timeFrom: '',
    timeTo: '',
    reason: '',
    image: null
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const bookingTypes = [
    { value: 'rehearsals', label: 'Rehearsals', pricePerHour: 50 },
    { value: 'events', label: 'Events', pricePer3Hours: 300 }
  ];

  // Generate hourly time slots from 10 AM to 10 PM for Rehearsals
  const generateRehearsalTimeSlots = (): string[] => {
    const slots: string[] = [];
    for (let hour = 10; hour <= 22; hour++) {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      slots.push(`${displayHour}:00 ${period}`);
    }
    return slots;
  };

  // Generate 4-hour time slots for Events
  const generateEventTimeSlots = (): { from: string; to: string }[] => {
    const slots: { from: string; to: string }[] = [];
    const startHours = [10, 14, 18]; // 10 AM, 2 PM, 6 PM
    
    startHours.forEach(startHour => {
      const endHour = startHour + 4;
      const fromPeriod = startHour >= 12 ? 'PM' : 'AM';
      const toPeriod = endHour >= 12 ? 'PM' : 'AM';
      const fromDisplayHour = startHour > 12 ? startHour - 12 : startHour === 0 ? 12 : startHour;
      const toDisplayHour = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour;
      
      slots.push({
        from: `${fromDisplayHour}:00 ${fromPeriod}`,
        to: `${toDisplayHour}:00 ${toPeriod}`
      });
    });
    
    return slots;
  };

  const [availableTimeFrom, setAvailableTimeFrom] = useState<string[]>([]);
  const [availableTimeTo, setAvailableTimeTo] = useState<string[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // When booking type changes, reset time selections and update available slots
    if (name === 'bookingType') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        timeFrom: '',
        timeTo: ''
      }));
      
      if (value === 'rehearsals') {
        setAvailableTimeFrom(generateRehearsalTimeSlots());
        setAvailableTimeTo([]);
      } else if (value === 'events') {
        const eventSlots = generateEventTimeSlots();
        setAvailableTimeFrom(eventSlots.map(slot => slot.from));
        setAvailableTimeTo([]);
      } else {
        setAvailableTimeFrom([]);
        setAvailableTimeTo([]);
      }
    } else if (name === 'timeFrom') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        timeTo: '' // Reset timeTo when timeFrom changes
      }));
      
      // Generate available "to" times based on booking type
      if (formData.bookingType === 'rehearsals') {
        const fromIndex = generateRehearsalTimeSlots().indexOf(value);
        if (fromIndex !== -1) {
          const remainingSlots = generateRehearsalTimeSlots().slice(fromIndex + 1);
          setAvailableTimeTo(remainingSlots);
        }
      } else if (formData.bookingType === 'events') {
        const eventSlots = generateEventTimeSlots();
        const selectedSlot = eventSlots.find(slot => slot.from === value);
        if (selectedSlot) {
          setAvailableTimeTo([selectedSlot.to]);
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Initialize time slots when booking type is selected
  useEffect(() => {
    if (formData.bookingType === 'rehearsals') {
      setAvailableTimeFrom(generateRehearsalTimeSlots());
    } else if (formData.bookingType === 'events') {
      const eventSlots = generateEventTimeSlots();
      setAvailableTimeFrom(eventSlots.map(slot => slot.from));
    }
  }, [formData.bookingType]);

  // Fetch available time slots when date changes
  useEffect(() => {
    if (formData.date && formData.bookingType) {
      setCheckingAvailability(true);
      fetch(`${API_BASE_URL}/bookings/available-times?date=${formData.date}&type=${formData.bookingType}`)
        .then(res => res.json())
        .then(() => {
          // Handle response - might need to filter available slots
          setCheckingAvailability(false);
        })
        .catch(err => {
          console.error('Error fetching available times:', err);
          setCheckingAvailability(false);
        });
    }
  }, [formData.date, formData.bookingType]);

  const getSelectedPrice = () => {
    const selectedType = bookingTypes.find(type => type.value === formData.bookingType);
    if (!selectedType) return 0;
    
    if (formData.bookingType === 'rehearsals') {
      // Calculate price based on hours selected
      if (formData.timeFrom && formData.timeTo && selectedType.pricePerHour) {
        const fromIndex = generateRehearsalTimeSlots().indexOf(formData.timeFrom);
        const toIndex = generateRehearsalTimeSlots().indexOf(formData.timeTo);
        if (fromIndex !== -1 && toIndex !== -1 && toIndex > fromIndex) {
          const hours = toIndex - fromIndex;
          return hours * selectedType.pricePerHour;
        }
      }
      return 0;
    } else if (formData.bookingType === 'events') {
      // Events are 300 EGP per 4-hour block
      if (formData.timeFrom && formData.timeTo && 'pricePer3Hours' in selectedType) {
        return selectedType.pricePer3Hours; // Price is 300 EGP per block
      }
      return 0;
    }
    
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const selectedType = bookingTypes.find(type => type.value === formData.bookingType);
      if (!selectedType) {
        throw new Error('Please select a booking type');
      }

      if (!formData.timeFrom || !formData.timeTo) {
        throw new Error('Please select both start and end times');
      }

      const calculatedPrice = getSelectedPrice();
      if (calculatedPrice === 0 || calculatedPrice === undefined) {
        throw new Error('Please select valid time slots');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('bookingType', formData.bookingType);
      formDataToSend.append('price', calculatedPrice.toString());
      formDataToSend.append('date', formData.date);
      formDataToSend.append('timeFrom', formData.timeFrom);
      formDataToSend.append('timeTo', formData.timeTo);
      // Keep 'time' for backward compatibility (combine from and to)
      formDataToSend.append('time', `${formData.timeFrom} - ${formData.timeTo}`);
      
      if (formData.reason) {
        formDataToSend.append('reason', formData.reason);
      }
      
      if (formData.image) {
        formDataToSend.append('receipt', formData.image);
      }

      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create booking');
      }

      await response.json();
      alert('Booking submitted successfully!');
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        bookingType: '',
        date: '',
        timeFrom: '',
        timeTo: '',
        reason: '',
        image: null
      });
      setImagePreview(null);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your booking');
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-form">
      <div className="form-container">
        <button className="back-button" onClick={() => window.history.back()}>
          ← Back
        </button>
        
        <h1 className="form-title">Theater Booking Form</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bookingType">Type of Booking</label>
            <select
              id="bookingType"
              name="bookingType"
              className="form-select"
              value={formData.bookingType}
              onChange={handleInputChange}
              required
            >
              <option value="">Select booking type</option>
              {bookingTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.value === 'rehearsals' ? '50 EGP/hour' : '300 EGP per 4 hours'}
                </option>
              ))}
            </select>
          </div>

          {formData.bookingType && (
            <div className="price-display">
              {formData.timeFrom && formData.timeTo ? (
                <>
                  <div>Time: {formData.timeFrom} - {formData.timeTo}</div>
                  <div style={{ marginTop: '0.5rem' }}>Total Price: EGP {getSelectedPrice()}</div>
                </>
              ) : (
                <div>
                  {formData.bookingType === 'rehearsals' 
                    ? 'Select time slots (50 EGP per hour)'
                    : 'Select time slot (300 EGP per 4 hours)'}
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="date">
              <Calendar size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Booking Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              className="form-input"
              value={formData.date}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {formData.bookingType && (
            <div className="date-time-container">
              <div className="form-group">
                <label className="form-label" htmlFor="timeFrom">
                  <Clock size={20} style={{ display: 'inline', marginRight: '8px' }} />
                  From Time
                  {checkingAvailability && <Loader size={16} style={{ display: 'inline', marginLeft: '8px', animation: 'spin 1s linear infinite' }} />}
                </label>
                <select
                  id="timeFrom"
                  name="timeFrom"
                  className="form-select"
                  value={formData.timeFrom}
                  onChange={handleInputChange}
                  disabled={checkingAvailability || availableTimeFrom.length === 0}
                  required
                >
                  <option value="">Select start time</option>
                  {availableTimeFrom.length > 0 ? (
                    availableTimeFrom.map(time => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No available times</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="timeTo">
                  <Clock size={20} style={{ display: 'inline', marginRight: '8px' }} />
                  To Time
                </label>
                <select
                  id="timeTo"
                  name="timeTo"
                  className="form-select"
                  value={formData.timeTo}
                  onChange={handleInputChange}
                  disabled={checkingAvailability || !formData.timeFrom || availableTimeTo.length === 0}
                  required
                >
                  <option value="">Select end time</option>
                  {availableTimeTo.length > 0 ? (
                    availableTimeTo.map(time => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      {formData.timeFrom ? 'Select start time first' : 'No available times'}
                    </option>
                  )}
                </select>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="reason">Reason (Optional)</label>
            <textarea
              id="reason"
              name="reason"
              className="form-textarea"
              value={formData.reason}
              onChange={handleInputChange}
              placeholder="Optional: Add any special requests or reasons for booking"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Upload Image</label>
            <div className="file-upload" onClick={() => document.getElementById('imageUpload')?.click()}>
              <Upload size={40} style={{ marginBottom: '1rem', color: '#8B5CF6' }} />
              <p>Click to upload an image</p>
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
            {imagePreview && (
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '200px', 
                    maxHeight: '200px', 
                    borderRadius: '10px',
                    border: '2px solid #8B5CF6'
                  }} 
                />
              </div>
            )}
          </div>

          <div className="payment-info">
            <h3>Payment Instructions</h3>
            <p>Please send payment using InstaPay to the following number:</p>
            <div className="payment-number">
              01224587074
            </div>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              After payment, please upload the receipt image above and submit your booking.
            </p>
          </div>

          {error && (
            <div style={{ 
              background: '#fee', 
              color: '#c33', 
              padding: '1rem', 
              borderRadius: '10px', 
              marginBottom: '1rem',
              border: '1px solid #fcc'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-button" 
            disabled={loading || checkingAvailability}
            style={{ opacity: loading || checkingAvailability ? 0.6 : 1 }}
          >
            {loading ? (
              <>
                <Loader size={20} style={{ display: 'inline', marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                Submitting...
              </>
            ) : (
              'Complete Booking'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
