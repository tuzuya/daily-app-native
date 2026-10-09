import { useTodayTasks } from "@/hooks/use-tasks";
import { FlatList, StyleSheet, Text, View } from "react-native";

export default function TodayScreen() {
  const { data, isPending, isError } = useTodayTasks();

  if (isPending)
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  if (isError)
    return (
      <View style={styles.container}>
        <Text>Error occurred while fetching tasks.</Text>
      </View>
    );
  if (data.length === 0)
    return (
      <View style={styles.container}>
        <Text>今日のクエストはない</Text>
      </View>
    );
  // FlatListのプロパティは特殊で、dataが実際に並ぶもの、
  // keyExtractorはdataを何で識別して並べるかを決める。識別することで、無駄な再描画を防げる
  // renderItemは{ item }の形でdataの中身を分割代入して、表示のために取り出して表示する
  return (
    <FlatList
      data={data}
      keyExtractor={(task) => task.id}
      renderItem={({ item }) => <Text>{item.title}</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
