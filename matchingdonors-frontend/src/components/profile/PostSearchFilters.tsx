import React, { useState, useEffect } from 'react';
import './PostSearchFilters.css'

interface PostSearchFiltersProps {
    onFilterChange: (filters: FilterState) => void;
    matchTier: 'all' | 'excellent' | 'good';
    onMatchTierChange: (tier: 'all' | 'excellent' | 'good') => void;
}

export interface FilterState {
    country: string;
    state: string;
}

// Country-to-states mapping
const LOCATION_DATA: { [country: string]: string[] } = {
    'USA': [
        'All States',
        'California', 'Texas', 'Florida', 'New York', 'Pennsylvania',
        'Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan',
        'New Jersey', 'Virginia', 'Washington', 'Arizona', 'Massachusetts'
    ],
    'UK': [
        'All Regions',
        'England', 'Scotland', 'Wales', 'Northern Ireland'
    ],
    'Canada': [
        'All Provinces',
        'Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba',
        'Saskatchewan', 'Nova Scotia', 'New Brunswick'
    ],
    'Australia': [
        'All States',
        'New South Wales', 'Victoria', 'Queensland', 'Western Australia',
        'South Australia', 'Tasmania', 'Australian Capital Territory'
    ],
    'Germany': [
        'All States',
        'Bavaria', 'Berlin', 'Hamburg', 'Hesse', 'North Rhine-Westphalia',
        'Saxony', 'Baden-Württemberg', 'Lower Saxony'
    ],
    'Japan': [
        'All Prefectures',
        'Tokyo', 'Osaka', 'Kyoto', 'Hokkaido', 'Kanagawa',
        'Aichi', 'Fukuoka', 'Saitama'
    ],
    'India': [
        'All States',
        'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat',
        'West Bengal', 'Rajasthan', 'Uttar Pradesh'
    ],
    'Brazil': [
        'All States',
        'São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia',
        'Paraná', 'Rio Grande do Sul', 'Pernambuco'
    ],
    'China': [
        'All Provinces',
        'Beijing', 'Shanghai', 'Guangdong', 'Zhejiang', 'Jiangsu',
        'Sichuan', 'Hubei', 'Hebei'
    ],
    'Mexico': [
        'All States',
        'Mexico City', 'Jalisco', 'Nuevo León', 'Guanajuato',
        'Puebla', 'Veracruz', 'Chihuahua'
    ]
};

const PostSearchFilters: React.FC<PostSearchFiltersProps> = ({
    onFilterChange,
    matchTier,
    onMatchTierChange
}) => {
    const [selectedCountry, setSelectedCountry] = useState<string>('All Countries');
    const [selectedState, setSelectedState] = useState<string>('All States');
    const [availableStates, setAvailableStates] = useState<string[]>(['All States']);

    // Update available states when country changes
    useEffect(() => {
        if (selectedCountry === 'All Countries') {
            setAvailableStates(['All States']);
            setSelectedState('All States');
        } else {
            const states = LOCATION_DATA[selectedCountry] || ['All States'];
            setAvailableStates(states);
            setSelectedState(states[0]); // Auto-select first option
        }
    }, [selectedCountry]);

    // Notify parent of filter changes
    useEffect(() => {
        onFilterChange({
            country: selectedCountry,
            state: selectedState
        });
    }, [selectedCountry, selectedState, onFilterChange]);

    const countries = ['All Countries', ...Object.keys(LOCATION_DATA)];

    return (
        <div className="post-search-filters">
            <div className="filter-section">
                <h3>Filter Results</h3>

                {/* Geographic Filters */}
                <div className="geographic-filters">
                    <div className="filter-row">
                        <label htmlFor="country-filter">Country:</label>
                        <select
                            id="country-filter"
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value)}
                            className="filter-select"
                        >
                            {countries.map((country) => (
                                <option key={country} value={country}>
                                    {country}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-row">
                        <label htmlFor="state-filter">State/Region:</label>
                        <select
                            id="state-filter"
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="filter-select"
                            disabled={selectedCountry === 'All Countries'}
                        >
                            {availableStates.map((state) => (
                                <option key={state} value={state}>
                                    {state}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Match Tier Filters */}
                <div className="match-tier-filters">
                    <label>Match Quality:</label>
                    <div className="tier-buttons">
                        <button
                            className={matchTier === 'all' ? 'active' : ''}
                            onClick={() => onMatchTierChange('all')}
                        >
                            All Matches
                        </button>
                        <button
                            className={matchTier === 'excellent' ? 'active' : ''}
                            onClick={() => onMatchTierChange('excellent')}
                        >
                            Excellent (≥80%)
                        </button>
                        <button
                            className={matchTier === 'good' ? 'active' : ''}
                            onClick={() => onMatchTierChange('good')}
                        >
                            Good (≥60%)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostSearchFilters;
