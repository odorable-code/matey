import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class scratch {
    public static void main(String[] args) throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/matey?useSSL=false&serverTimezone=Asia/Seoul&allowPublicKeyRetrieval=true", "root", "root");
        Statement stmt = conn.createStatement();
        stmt.execute("ALTER TABLE USER MODIFY profile_image LONGTEXT;");
        System.out.println("Column modified successfully.");
        conn.close();
    }
}
