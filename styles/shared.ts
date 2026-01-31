import { Dimensions, StyleSheet } from 'react-native';

export const screenWidth = Dimensions.get('screen').width;
export const screenHeight = Dimensions.get('screen').height;

export const sharedStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  columnCenterWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingBottom: 50,
  },
  inputsWrapper: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  iconContainer: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    fontSize: 40,
    textAlign: 'left',
    marginBottom: 20,
  },
  smallHeader: {
    fontSize: 22,
    textAlign: 'left',
  },
  smallHeaderWrapper: {
    paddingHorizontal: 25,
    width: '100%',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    opacity: 0.7,
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
