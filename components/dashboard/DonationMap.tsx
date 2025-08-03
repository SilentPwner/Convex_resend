// components/dashboard/DonationMap.tsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Donation } from '@/types';

// Fix for default marker icons in Leaflet
const DefaultIcon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface DonationMapProps {
  donations: Donation[];
}

const DonationMap: React.FC<DonationMapProps> = ({ donations }) => {
  // Default coordinates (center of the map)
  const defaultCenter: [number, number] = [20, 0];
  const defaultZoom = 2;

  // Filter donations with valid coordinates
  const validDonations = donations.filter(d => 
    d.location?.latitude && d.location?.longitude
  );

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-md">
      <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {validDonations.map((donation) => (
          <Marker
            key={donation.id}
            position={[donation.location.latitude, donation.location.longitude]}
          >
            <Popup>
              <div className="space-y-1">
                <h3 className="font-semibold">{donation.donorName}</h3>
                <p>Amount: ${donation.amount.toFixed(2)}</p>
                <p>Date: {new Date(donation.date).toLocaleDateString()}</p>
                {donation.message && (
                  <p className="text-sm italic">"{donation.message}"</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default DonationMap;