import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { db } from '@/db/client';

import migrations from '../../drizzle/migrations';

export default function RootLayout() {
  // 起動時に未適用のマイグレーションを適用する。完了するまで画面を出さない
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={styles.center}>
        <Text>DB migration error: {error.message}</Text>
      </View>
    );
  }
  if (!success) {
    return null;
  }

  return <Stack />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
