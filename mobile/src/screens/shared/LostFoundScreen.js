import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { lostFoundAPI } from '../../services/api';
import { COLORS, SHADOWS } from '../../theme/theme';
import { useAuth } from '../../store/authStore';

const ITEM_CATEGORIES = [
  { id: 'id_card', label: 'Amrita ID Card', icon: '🪪' },
  { id: 'mobile', label: 'Phone / Mobile', icon: '📱' },
  { id: 'laptop', label: 'Laptop / Tablet', icon: '💻' },
  { id: 'wallet', label: 'Wallet / Purse', icon: '👛' },
  { id: 'keys', label: 'Keys / Keyring', icon: '🔑' },
  { id: 'bag', label: 'Bag / Backpack', icon: '🎒' },
  { id: 'book', label: 'Book / Notebook', icon: '📚' },
  { id: 'headphones', label: 'Earphones / Buds', icon: '🎧' },
  { id: 'charger', label: 'Adapter / Cable', icon: '🔌' },
  { id: 'water_bottle', label: 'Water Bottle', icon: '🍶' },
  { id: 'calculator', label: 'Calculator', icon: '🧮' },
  { id: 'other', label: 'Other Item', icon: '📦' },
];

export default function LostFoundScreen({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('lost'); // 'lost' | 'found'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Report Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportType, setReportType] = useState('lost'); // 'lost' | 'found'
  const [itemCategory, setItemCategory] = useState('id_card');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [location, setLocation] = useState('');
  const [submittedTo, setSubmittedTo] = useState('');
  const [imageUri, setImageUri] = useState(null);

  const fetchItems = async () => {
    try {
      const response = await lostFoundAPI.getAll();
      const list = response.data?.reports || response.data?.data || (Array.isArray(response.data) ? response.data : []);
      setItems(Array.isArray(list) ? list : []);
    } catch (error) {
      console.warn('Failed to fetch items', error);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const pickImage = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Gallery permission is required to select photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Image Error', 'Could not access camera or library.');
    }
  };

  const handleSubmit = async () => {
    if (!itemName.trim() || !description.trim() || !location.trim()) {
      Alert.alert('Missing Details', 'Please fill out Item Name, Description, and Location.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', reportType);
      formData.append('itemCategory', itemCategory);
      formData.append('itemName', itemName.trim());
      formData.append('description', description.trim());
      formData.append('dateTime', new Date().toISOString());

      if (color.trim()) formData.append('color', color.trim());
      if (brand.trim()) formData.append('brand', brand.trim());

      if (reportType === 'lost') {
        formData.append('lastSeenLocation', location.trim());
      } else {
        formData.append('foundLocation', location.trim());
        if (submittedTo.trim()) formData.append('submittedTo', submittedTo.trim());
      }

      if (imageUri) {
        const uriParts = imageUri.split('.');
        const fileType = uriParts[uriParts.length - 1] || 'jpg';
        formData.append('photos', {
          uri: imageUri,
          name: `item_${Date.now()}.${fileType}`,
          type: `image/${fileType === 'png' ? 'png' : 'jpeg'}`,
        });
      }

      await lostFoundAPI.create(formData);
      setSubmitting(false);
      setModalVisible(false);

      // Reset form
      setItemName('');
      setDescription('');
      setColor('');
      setBrand('');
      setLocation('');
      setSubmittedTo('');
      setImageUri(null);

      Alert.alert('Item Registered! 🔍', 'Our AI matching engine will cross-check this item against campus reports.');
      fetchItems();
    } catch (error) {
      setSubmitting(false);
      Alert.alert('Error', error.response?.data?.message || 'Could not register item. Please try again.');
    }
  };

  const handleClaim = (item) => {
    Alert.alert(
      'Claim Belonging',
      `To claim "${item.itemName}", please visit ${item.submittedTo || 'the Student Welfare Office'} with proof of identity.`,
      [{ text: 'Understood' }]
    );
  };

  const filteredItems = items.filter(item => {
    if (item.type !== activeTab) return false;
    if (selectedCategory !== 'all' && item.itemCategory !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.itemName?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchLoc = (item.lastSeenLocation || item.foundLocation || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchLoc) return false;
    }
    return true;
  });

  const renderItem = ({ item }) => {
    if (!item) return null;
    const catObj = ITEM_CATEGORIES.find(c => c.id === item.itemCategory) || { label: 'Item', icon: '📦' };
    const locStr = item.type === 'lost' ? item.lastSeenLocation : item.foundLocation;
    const photoUrl = item.photos && item.photos.length > 0 ? item.photos[0].url : null;
    const hasMatches = Array.isArray(item.potentialMatches) && item.potentialMatches.length > 0;

    return (
      <View style={[styles.card, SHADOWS.card]}>
        <View style={styles.cardHeader}>
          <View style={styles.catPill}>
            <Text style={styles.catPillIcon}>{catObj.icon}</Text>
            <Text style={styles.catPillLabel}>{catObj.label}</Text>
          </View>
          <View style={[styles.statusBadge, item.type === 'lost' ? styles.statusLost : styles.statusFound]}>
            <Text style={[styles.statusBadgeText, item.type === 'lost' ? styles.statusLostText : styles.statusFoundText]}>
              {item.type === 'lost' ? '🔴 LOST' : '🟢 FOUND'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.itemImage} />
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Text style={{ fontSize: 32 }}>{catObj.icon}</Text>
            </View>
          )}

          <View style={styles.cardDetails}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.itemName || 'Unnamed Item'}</Text>
            <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
            
            {locStr && (
              <Text style={styles.itemLocation} numberOfLines={1}>📍 {locStr}</Text>
            )}

            {(item.brand || item.color) && (
              <Text style={styles.itemMeta} numberOfLines={1}>
                {[item.brand, item.color].filter(Boolean).join(' • ')}
              </Text>
            )}
          </View>
        </View>

        {/* AI Multimodal Match Banner */}
        {hasMatches && (
          <View style={styles.matchBanner}>
            <Text style={styles.matchBannerIcon}>⚡</Text>
            <Text style={styles.matchBannerText}>
              Gemini AI detected {item.potentialMatches.length} matching candidate(s)!
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            Reported: {new Date(item.dateTime || item.createdAt || Date.now()).toLocaleDateString()}
          </Text>

          {item.type === 'found' && (
            <TouchableOpacity 
              style={styles.claimBtn}
              onPress={() => handleClaim(item)}
            >
              <Text style={styles.claimBtnText}>Claim Item</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerSubtitle}>AMRITA RECOVERY NETWORK</Text>
          <TouchableOpacity 
            style={styles.reportActionBtn}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.reportActionBtnText}>+ Report Item</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Lost & Found</Text>

        {/* Tab Toggle */}
        <View style={styles.tabToggle}>
          <TouchableOpacity 
            style={[styles.toggleBtn, activeTab === 'lost' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('lost')}
          >
            <Text style={[styles.toggleBtnText, activeTab === 'lost' && styles.toggleBtnTextActive]}>
              🔴 Lost Items
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, activeTab === 'found' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('found')}
          >
            <Text style={[styles.toggleBtnText, activeTab === 'found' && styles.toggleBtnTextActive]}>
              🟢 Found Items
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search items by name, color, or location..."
            placeholderTextColor={COLORS.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.categoryBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          <TouchableOpacity
            style={[styles.catFilterChip, selectedCategory === 'all' && styles.catFilterChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.catFilterText, selectedCategory === 'all' && styles.catFilterTextActive]}>
              All Categories
            </Text>
          </TouchableOpacity>
          {ITEM_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catFilterChip, selectedCategory === cat.id && styles.catFilterChipActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.catFilterText, selectedCategory === cat.id && styles.catFilterTextActive]}>
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading campus items...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => item._id || item.id || String(Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>📦</Text>
              <Text style={styles.emptyTitle}>No Items Reported</Text>
              <Text style={styles.emptySub}>
                {activeTab === 'lost' 
                  ? 'No lost items match your current filter. Report an item if you lost something on campus.'
                  : 'No discovered items reported yet.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Report Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalSubtitle}>CAMPUS BELONGINGS REGISTRATION</Text>
                <Text style={styles.modalTitle}>Report Item</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Type Switcher */}
              <View style={styles.typeSwitcher}>
                <TouchableOpacity
                  style={[styles.typeSwitchBtn, reportType === 'lost' && styles.typeSwitchBtnActiveLost]}
                  onPress={() => setReportType('lost')}
                >
                  <Text style={[styles.typeSwitchText, reportType === 'lost' && styles.typeSwitchTextActive]}>
                    🔴 I Lost an Item
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeSwitchBtn, reportType === 'found' && styles.typeSwitchBtnActiveFound]}
                  onPress={() => setReportType('found')}
                >
                  <Text style={[styles.typeSwitchText, reportType === 'found' && styles.typeSwitchTextActive]}>
                    🟢 I Found an Item
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Item Name */}
              <Text style={styles.fieldLabel}>Item Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Blue Dell Laptop Charger (65W)"
                placeholderTextColor={COLORS.textDisabled}
                value={itemName}
                onChangeText={setItemName}
              />

              {/* Category Picker */}
              <Text style={styles.fieldLabel}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {ITEM_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.modalCatChip, itemCategory === cat.id && styles.modalCatChipActive]}
                    onPress={() => setItemCategory(cat.id)}
                  >
                    <Text style={[styles.modalCatChipText, itemCategory === cat.id && styles.modalCatChipTextActive]}>
                      {cat.icon} {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Description */}
              <Text style={styles.fieldLabel}>Detailed Description *</Text>
              <TextInput
                style={[styles.textInput, { height: 75, textAlignVertical: 'top' }]}
                placeholder="Key marks, stickers, color, model number, etc..."
                placeholderTextColor={COLORS.textDisabled}
                multiline
                value={description}
                onChangeText={setDescription}
              />

              {/* Color & Brand */}
              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Color</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Matte Black"
                    placeholderTextColor={COLORS.textDisabled}
                    value={color}
                    onChangeText={setColor}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Brand</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Dell / Apple"
                    placeholderTextColor={COLORS.textDisabled}
                    value={brand}
                    onChangeText={setBrand}
                  />
                </View>
              </View>

              {/* Location */}
              <Text style={styles.fieldLabel}>
                {reportType === 'lost' ? 'Last Seen Location *' : 'Found Location *'}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Central Library 2nd Floor, Table 14"
                placeholderTextColor={COLORS.textDisabled}
                value={location}
                onChangeText={setLocation}
              />

              {/* If Found: Submitted To */}
              {reportType === 'found' && (
                <>
                  <Text style={styles.fieldLabel}>Handed Over / Stored At</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Warden Office, Security Gate 1"
                    placeholderTextColor={COLORS.textDisabled}
                    value={submittedTo}
                    onChangeText={setSubmittedTo}
                  />
                </>
              )}

              {/* Photo Evidence Picker */}
              <Text style={styles.fieldLabel}>Photograph (Optional)</Text>
              {imageUri ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                    <Text style={styles.removeImageText}>✕ Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoActionRow}>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(true)}>
                    <Text style={styles.photoBtnIcon}>📷</Text>
                    <Text style={styles.photoBtnText}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(false)}>
                    <Text style={styles.photoBtnIcon}>🖼️</Text>
                    <Text style={styles.photoBtnText}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.disabledBtn]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Submit to Recovery Engine</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  reportActionBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  reportActionBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.card,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  toggleBtnTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  clearSearch: {
    fontSize: 14,
    color: COLORS.textMuted,
    padding: 4,
  },
  categoryBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  catFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: COLORS.bgSecondary,
    marginRight: 8,
  },
  catFilterChipActive: {
    backgroundColor: COLORS.primary,
  },
  catFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  catFilterTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  catPillIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  catPillLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusLost: {
    backgroundColor: COLORS.roseLight,
  },
  statusFound: {
    backgroundColor: COLORS.emeraldLight,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusLostText: {
    color: COLORS.rose,
  },
  statusFoundText: {
    color: COLORS.emerald,
  },
  cardBody: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  itemImage: {
    width: 74,
    height: 74,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: COLORS.bgSecondary,
  },
  noImagePlaceholder: {
    width: 74,
    height: 74,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: COLORS.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: 4,
  },
  itemLocation: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  matchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.violetLight,
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.violet,
  },
  matchBannerIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  matchBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.violet,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    paddingTop: 10,
    marginTop: 4,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  claimBtn: {
    backgroundColor: COLORS.emeraldLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.emerald,
  },
  claimBtnText: {
    color: COLORS.emerald,
    fontSize: 12,
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 22,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeBtnText: {
    fontSize: 20,
    color: COLORS.textMuted,
    padding: 4,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 8,
    padding: 3,
    marginBottom: 14,
  },
  typeSwitchBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeSwitchBtnActiveLost: {
    backgroundColor: COLORS.rose,
  },
  typeSwitchBtnActiveFound: {
    backgroundColor: COLORS.emerald,
  },
  typeSwitchText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  typeSwitchTextActive: {
    color: COLORS.white,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: COLORS.bgPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  modalCatChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 8,
    marginRight: 8,
  },
  modalCatChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  modalCatChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalCatChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  photoActionRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  photoBtnIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  photoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  previewContainer: {
    marginTop: 6,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
  },
  removeImageBtn: {
    marginTop: 6,
    padding: 6,
  },
  removeImageText: {
    color: COLORS.rose,
    fontWeight: '700',
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 30,
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
