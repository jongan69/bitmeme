import React, { useState, useEffect } from 'react';
import { Button, View, TextInput, Text, Alert, StyleSheet, Platform, useColorScheme } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DropDownPicker from 'react-native-dropdown-picker';
import { WebView } from 'react-native-webview';

import * as Form from "@/components/ui/Form";
import { useWalletOnboarding } from '@/hooks/useWallets';

import { useUser } from '@clerk/clerk-react';

const NETWORKS = [
    { label: 'Ethereum', value: 'ethereum' },
    { label: 'Base', value: 'base' },
    { label: 'Solana', value: 'solana' },
    { label: 'Polygon', value: 'polygon' },
    { label: 'Bitcoin', value: 'bitcoin' },
];

const CURRENCIES_BY_NETWORK: Record<string, { label: string, value: string }[]> = {
    ethereum: [
        { label: 'ETH', value: 'eth' },
        { label: 'USDC', value: 'usdc' },
    ],
    base: [
        { label: 'ETH', value: 'eth' },
        { label: 'USDC', value: 'usdc' },
    ],
    solana: [
        { label: 'SOL', value: 'sol' },
        { label: 'USDC', value: 'usdc' },
    ],
    polygon: [
        { label: 'MATIC', value: 'matic' },
        { label: 'USDC', value: 'usdc' },
    ],
    bitcoin: [
        { label: 'BTC', value: 'btc' },
    ],
};

export default function OnrampScreen() {
    const { user } = useUser();
    const emailFromClerk = user?.emailAddresses[0].emailAddress || '';
    const [sessionUrl, setSessionUrl] = useState<string | null>(null);
    const [showWebView, setShowWebView] = useState(false);
    const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
    const [selectedCurrency, setSelectedCurrency] = useState('eth');
    const [amount, setAmount] = useState('1');
    const { solanaAddress, bitcoinAddress, ethereumAddress } = useWalletOnboarding();
    const colorScheme = useColorScheme();

    // Dropdown state
    const [networkOpen, setNetworkOpen] = useState(false);
    const [currencyOpen, setCurrencyOpen] = useState(false);
    const [networkItems, setNetworkItems] = useState(NETWORKS);
    const [currencyItems, setCurrencyItems] = useState(CURRENCIES_BY_NETWORK[selectedNetwork]);

    // KYC fields
    const [email, setEmail] = useState(emailFromClerk);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dobYear, setDobYear] = useState('');
    const [dobMonth, setDobMonth] = useState('');
    const [dobDay, setDobDay] = useState('');
    const [country, setCountry] = useState('');
    const [addressLine1, setAddressLine1] = useState('');
    const [addressLine2, setAddressLine2] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [postalCode, setPostalCode] = useState('');

    // Prefill KYC fields from Clerk unsafeMetadata.kyc if available
    useEffect(() => {
        const kyc = user?.unsafeMetadata?.kyc;
        if (kyc && typeof kyc === 'object') {
            const kycObj = kyc as Record<string, any>;
            setEmail(typeof kycObj.email === 'string' ? kycObj.email : emailFromClerk);
            setFirstName(typeof kycObj.first_name === 'string' ? kycObj.first_name : '');
            setLastName(typeof kycObj.last_name === 'string' ? kycObj.last_name : '');
            const dob = kycObj.dob as Record<string, any> | undefined;
            setDobYear(dob && typeof dob.year === 'string' ? dob.year : '');
            setDobMonth(dob && typeof dob.month === 'string' ? dob.month : '');
            setDobDay(dob && typeof dob.day === 'string' ? dob.day : '');
            const address = kycObj.address as Record<string, any> | undefined;
            setCountry(address && typeof address.country === 'string' ? address.country : '');
            setAddressLine1(address && typeof address.line1 === 'string' ? address.line1 : '');
            setAddressLine2(address && typeof address.line2 === 'string' ? address.line2 : '');
            setCity(address && typeof address.city === 'string' ? address.city : '');
            setState(address && typeof address.state === 'string' ? address.state : '');
            setPostalCode(address && typeof address.postal_code === 'string' ? address.postal_code : '');
        }
    }, [user]);

    // Update currency items when network changes
    useEffect(() => {
        setCurrencyItems(CURRENCIES_BY_NETWORK[selectedNetwork]);
        setSelectedCurrency(CURRENCIES_BY_NETWORK[selectedNetwork][0].value);
    }, [selectedNetwork]);

    const saveKycToUser = async (kycData: any) => {
        await user?.update({
            unsafeMetadata: {
                ...user?.unsafeMetadata,
                kyc: kycData,
            },
        });
    };

    const validateForm = () => {
        if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
            Alert.alert('Invalid email', 'Please enter a valid email address.');
            return false;
        }
        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert('Name required', 'Please enter your first and last name.');
            return false;
        }
        if (!dobYear || !dobMonth || !dobDay ||
            isNaN(Number(dobYear)) || isNaN(Number(dobMonth)) || isNaN(Number(dobDay))) {
            Alert.alert('Invalid date of birth', 'Please enter a valid date of birth.');
            return false;
        }
        if (!country || country.length !== 2) {
            Alert.alert('Invalid country', 'Please enter a valid 2-letter country code.');
            return false;
        }
        if (!addressLine1.trim() || !city.trim() || !state.trim() || !postalCode.trim()) {
            Alert.alert('Address required', 'Please fill in all address fields.');
            return false;
        }
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            Alert.alert('Invalid amount', 'Please enter a valid amount.');
            return false;
        }
        return true;
    };

    const fetchSessionUrl = async () => {
        if (selectedNetwork === 'stellar') {
            Alert.alert('Not supported', 'Stellar wallet address is not available in this app.');
            return;
        }
        if (!validateForm()) return;
        const payload: Record<string, any> = {
            // Always send all wallet addresses
            ethereumAddress,
            solanaAddress,
            bitcoinAddress,
            // Add more wallet addresses as needed
        };
        // Only send destination fields if selected
        if (selectedNetwork) {
            payload.destination_networks = [selectedNetwork];
        }
        if (selectedCurrency) {
            payload.destination_currencies = [selectedCurrency];
        }
        if (selectedNetwork) {
            payload.destination_network = selectedNetwork;
        }
        if (selectedCurrency) {
            payload.destination_currency = selectedCurrency;
        }
        if (amount) {
            payload.destination_amount = amount;
        }      

        // Add customer_information for KYC prefill
        const kycData = {
            email,
            first_name: firstName,
            last_name: lastName,
            dob: dobYear && dobMonth && dobDay ? {
                year: dobYear,
                month: dobMonth,
                day: dobDay
            } : undefined,
            address: {
                country,
                line1: addressLine1,
                line2: addressLine2,
                city,
                state,
                postal_code: postalCode
            }
        };
        payload.customer_information = kycData;

        // Save KYC data to Clerk for future prefill
        await saveKycToUser(kycData);

        const response = await fetch('/api/stripe/create-onramp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        setSessionUrl(data.redirect_url);
        setShowWebView(true);
    };

    // Styles based on color scheme
    const isDark = colorScheme === 'dark';
    const themedStyles = getThemedStyles(isDark);

    return (
        <Form.List navigationTitle="Buy Crypto">
            {!showWebView && (
                <KeyboardAwareScrollView contentContainerStyle={themedStyles.scrollContainer}>
                    <View style={themedStyles.card}>
                        <Text style={themedStyles.title}>Buy Crypto</Text>
                        <Text style={themedStyles.sectionHeader}>Asset Selection</Text>
                        <View style={[themedStyles.inputGroup, { zIndex: 3000, position: 'relative' }]}>
                            <Text style={themedStyles.label}>Network</Text>
                            <DropDownPicker
                                listMode="SCROLLVIEW"
                                // searchable={true}
                                open={networkOpen}
                                value={selectedNetwork}
                                items={networkItems}
                                setOpen={setNetworkOpen}
                                setValue={setSelectedNetwork}
                                setItems={setNetworkItems}
                                style={{
                                    backgroundColor: isDark ? '#27272A' : '#F1F5F9',
                                    borderColor: isDark ? '#3F3F46' : '#E5E7EB',
                                    marginBottom: 16,
                                }}
                                dropDownContainerStyle={{
                                    
                                    backgroundColor: isDark ? '#23232A' : '#fff',
                                    borderColor: isDark ? '#3F3F46' : '#E5E7EB',
                                }}
                                textStyle={{
                                    color: isDark ? '#F1F5F9' : '#1E293B',
                                    fontSize: 16,
                                }}
                                theme={isDark ? 'DARK' : 'LIGHT'}
                                zIndex={3000}
                                zIndexInverse={1000}
                            />
                        </View>
                        <View style={[themedStyles.inputGroup, { zIndex: 2000, position: 'relative' }]}>
                            <Text style={themedStyles.label}>Currency</Text>
                            <DropDownPicker
                                listMode="SCROLLVIEW"
                                // searchable={true}
                                open={currencyOpen}
                                value={selectedCurrency}
                                items={currencyItems}
                                setOpen={setCurrencyOpen}
                                setValue={setSelectedCurrency}
                                setItems={setCurrencyItems}
                                style={{
                                    backgroundColor: isDark ? '#27272A' : '#F1F5F9',
                                    borderColor: isDark ? '#3F3F46' : '#E5E7EB',
                                    marginBottom: 16,
                                }}
                                dropDownContainerStyle={{
                                    backgroundColor: isDark ? '#23232A' : '#fff',
                                    borderColor: isDark ? '#3F3F46' : '#E5E7EB',
                                }}
                                textStyle={{
                                    color: isDark ? '#F1F5F9' : '#1E293B',
                                    fontSize: 16,
                                }}
                                theme={isDark ? 'DARK' : 'LIGHT'}
                                zIndex={2000}
                                zIndexInverse={2000}
                            />
                        </View>
                        <View style={themedStyles.inputGroup}>
                            <Text style={themedStyles.label}>Amount</Text>
                            <TextInput
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                style={themedStyles.input}
                                placeholder="Amount"
                                placeholderTextColor={isDark ? '#A1A1AA' : '#94A3B8'}
                            />
                        </View>
                        <View style={themedStyles.divider} />
                        <Text style={themedStyles.sectionHeader}>KYC Information</Text>
                        <View style={themedStyles.inputGroup}>
                            <Text style={themedStyles.label}>Email</Text>
                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                style={themedStyles.input}
                                autoCapitalize="none"
                                placeholder="Email"
                                placeholderTextColor={isDark ? '#A1A1AA' : '#94A3B8'}
                            />
                        </View>
                        <View style={themedStyles.rowGroup}>
                            <View style={[themedStyles.inputGroup, { flex: 1, marginRight: 8 }]}> 
                                <Text style={themedStyles.label}>First Name</Text>
                                <TextInput
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    style={themedStyles.input}
                                    placeholder="First Name"
                                    placeholderTextColor={isDark ? '#A1A1AA' : '#94A3B8'}
                                />
                            </View>
                            <View style={[themedStyles.inputGroup, { flex: 1 }]}> 
                                <Text style={themedStyles.label}>Last Name</Text>
                                <TextInput
                                    value={lastName}
                                    onChangeText={setLastName}
                                    style={themedStyles.input}
                                    placeholder="Last Name"
                                    placeholderTextColor={isDark ? '#A1A1AA' : '#94A3B8'}
                                />
                            </View>
                        </View>
                        <View style={themedStyles.inputGroup}>
                            <Text style={themedStyles.label}>Date of Birth</Text>
                            <View style={themedStyles.dobRow}>
                                <TextInput
                                    placeholder="YYYY"
                                    value={dobYear}
                                    onChangeText={setDobYear}
                                    keyboardType="numeric"
                                    style={[themedStyles.input, themedStyles.dobInput]}
                                    maxLength={4}
                                    placeholderTextColor={isDark ? '#A1A1AA' : '#94A3B8'}
                                />
                                <TextInput
                                    placeholder="MM"
                                    value={dobMonth}
                                    onChangeText={setDobMonth}
                                    keyboardType="numeric"
                                    style={[themedStyles.input, themedStyles.dobInput]}
                                    maxLength={2}
                                    placeholderTextColor={isDark ? '#A1A1AA' : '#94A3B8'}
                                />
                                <TextInput
                                    placeholder="DD"
                                    value={dobDay}
                                    onChangeText={setDobDay}
                                    keyboardType="numeric"
                                    style={[themedStyles.input, themedStyles.dobInput]}
                                    maxLength={2}
                                    placeholderTextColor={isDark ? '#A1A1AA' : '#94A3B8'}
                                />
                            </View>
                        </View>
                        <View style={themedStyles.inputGroup}>
                            <Text style={themedStyles.label}>Country (2-letter code)</Text>
                            <TextInput
                                value={country}
                                onChangeText={setCountry}
                                autoCapitalize="characters"
                                style={themedStyles.input}
                                placeholder="Country"
                                placeholderTextColor={isDark ? '#A1A1AA' : '#94A3B8'}
                            />
                        </View>
                        <View style={themedStyles.inputGroup}>
                            <Text style={themedStyles.label}>Address Line 1</Text>
                            <TextInput
                                value={addressLine1}
                                onChangeText={setAddressLine1}
                                style={themedStyles.input}
                                placeholder="Address Line 1"
                                placeholderTextColor={isDark ? '#A1A1AA' : '#94A3B8'}
                            />
                        </View>
                        <View style={themedStyles.inputGroup}>
                            <Text style={themedStyles.label}>Address Line 2</Text>
                            <TextInput
                                value={addressLine2}
                                onChangeText={setAddressLine2}
                                style={themedStyles.input}
                                placeholder="Address Line 2"
                                placeholderTextColor={isDark ? '#A1A1AA' : '#94A3B8'}
                            />
                        </View>
                        <View style={themedStyles.rowGroup}>
                            <View style={[themedStyles.inputGroup, { flex: 1, marginRight: 8 }]}> 
                                <Text style={themedStyles.label}>City</Text>
                                <TextInput
                                    value={city}
                                    onChangeText={setCity}
                                    style={themedStyles.input}
                                    placeholder="City"
                                    placeholderTextColor={isDark ? '#A1A1AA' : '#94A3B8'}
                                />
                            </View>
                            <View style={[themedStyles.inputGroup, { flex: 1 }]}> 
                                <Text style={themedStyles.label}>State</Text>
                                <TextInput
                                    value={state}
                                    onChangeText={setState}
                                    style={themedStyles.input}
                                    placeholder="State"
                                    placeholderTextColor={isDark ? '#A1A1AA' : '#94A3B8'}
                                />
                            </View>
                        </View>
                        <View style={themedStyles.inputGroup}>
                            <Text style={themedStyles.label}>Postal Code</Text>
                            <TextInput
                                value={postalCode}
                                onChangeText={setPostalCode}
                                style={themedStyles.input}
                                placeholder="Postal Code"
                                placeholderTextColor={isDark ? '#A1A1AA' : '#94A3B8'}
                            />
                        </View>
                        <Button title="Start Onramp" onPress={fetchSessionUrl} color={isDark ? '#6366F1' : '#4F46E5'} />
                    </View>
                </KeyboardAwareScrollView>
            )}
            {showWebView && sessionUrl ? (
                <View style={themedStyles.webviewContainer}>
                    <WebView
                        source={{ uri: sessionUrl }}
                        style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}
                        onNavigationStateChange={navState => {
                            // Optionally handle navigation events, e.g., close WebView on success/cancel
                        }}
                    />
                </View>
            ) : null}
        </Form.List>
    );
}

function getThemedStyles(isDark: boolean) {
    return StyleSheet.create({
        scrollContainer: {
            paddingVertical: 24,
            paddingHorizontal: 8,
            backgroundColor: isDark ? '#18181B' : '#F3F4F6',
            minHeight: '100%',
        },
        card: {
            backgroundColor: isDark ? '#23232A' : '#fff',
            borderRadius: 16,
            padding: 20,
            margin: 8,
            shadowColor: isDark ? '#000' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
        },
        title: {
            fontSize: 28,
            fontWeight: 'bold',
            marginBottom: 16,
            color: isDark ? '#F1F5F9' : '#1E293B',
            textAlign: 'center',
        },
        sectionHeader: {
            fontSize: 18,
            fontWeight: '600',
            marginTop: 16,
            marginBottom: 8,
            color: isDark ? '#A5B4FC' : '#6366F1',
        },
        label: {
            fontSize: 14,
            color: isDark ? '#CBD5E1' : '#334155',
            marginBottom: 4,
            marginLeft: 2,
        },
        input: {
            backgroundColor: isDark ? '#27272A' : '#F1F5F9',
            borderRadius: 8,
            padding: 10,
            fontSize: 16,
            borderWidth: 1,
            borderColor: isDark ? '#3F3F46' : '#E5E7EB',
            color: isDark ? '#F1F5F9' : '#1E293B',
            marginBottom: 0,
        },
        pickerWrapper: {
            backgroundColor: isDark ? '#27272A' : '#F1F5F9',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: isDark ? '#3F3F46' : '#E5E7EB',
            // height: '10%',yr
        },
        picker: {
            backgroundColor: isDark ? '#27272A' : '#F1F5F9',
            width: '100%',
            color: isDark ? '#F1F5F9' : '#1E293B',
        },
        pickerItem: {
            backgroundColor: isDark ? '#6366F1' : '#4F46E5',
            color: '#fff',
            fontFamily: Platform.OS === 'ios' ? 'System' : 'serif',
            fontSize: 16,
        },
        inputGroup: {
            marginBottom: 16,
        },
        rowGroup: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
        },
        dobRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        dobInput: {
            flex: 1,
            marginRight: 8,
        },
        divider: {
            height: 1,
            backgroundColor: isDark ? '#27272A' : '#E5E7EB',
            marginVertical: 20,
            borderRadius: 1,
        },
        webviewContainer: {
            flex: 1,
            backgroundColor: isDark ? '#18181B' : '#F3F4F6',
            borderRadius: 16,
            margin: 8,
            overflow: 'hidden',
            minHeight: 600,
        },
    });
}