import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLanguage } from '../hooks/useLanguage';
import termsData from '../static-data/terms_conditions.json';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
  onAgree?: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  visible,
  onClose,
  onAgree,
}) => {
  const { language } = useLanguage();
  
  // Get language-specific data
  const currentTermsData = termsData[language as keyof typeof termsData] || termsData.vi;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{currentTermsData.title}</Text>
          <Text style={styles.lastUpdated}>
            {language === 'vi' ? 'Cập nhật lần cuối: ' : 'Last updated: '}{currentTermsData.lastUpdated}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
          {currentTermsData.sections.map((section: any, index: number) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          ))}
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity style={styles.closeOnlyButton} onPress={onClose}>
            <Text style={styles.closeOnlyButtonText}>
              {language === 'vi' ? 'Đóng' : 'Close'}
            </Text>
          </TouchableOpacity>
          
          {onAgree && (
            <TouchableOpacity 
              style={styles.agreeButton} 
              onPress={() => {
                onAgree();
                onClose();
              }}
            >
              <Text style={styles.agreeButtonText}>
                {language === 'vi' ? 'Đồng ý' : 'Agree'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    position: 'relative',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 65,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  section: {
    marginBottom: 20,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    textAlign: 'left',
    marginBottom: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  closeOnlyButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  closeOnlyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  agreeButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  agreeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
