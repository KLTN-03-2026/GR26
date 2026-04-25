package com.smartfnb;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.smartfnb.shared.web.ApiResponse;
import com.smartfnb.shift.application.query.ShiftScheduleResult;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class JsonPrintScratch {
    public static void main(String[] args) throws Exception {
        UUID branchId = UUID.fromString("a7fc4472-d5c0-432d-b951-5c78e30fd905");
        
        ShiftScheduleResult mockResult1 = new ShiftScheduleResult(
                UUID.fromString("87f8e483-a277-46c9-84bc-0d32bc15c467"),
                UUID.fromString("2fad705b-e9ba-4f1a-8860-0aa34fc1c580"),
                "Nguyễn Văn A", // userName vừa thêm
                UUID.fromString("b0d746e4-a403-4894-ad3d-f74a082e3308"),
                branchId,
                LocalDate.parse("2026-04-25"),
                "SCHEDULED",
                null, null, null, null, 0, null
        );

        ShiftScheduleResult mockResult2 = new ShiftScheduleResult(
                UUID.fromString("bbe96055-0396-4918-9eea-eaf2b4f9229f"),
                UUID.fromString("c9fbec72-e09a-4924-a9f9-14ffde84b63a"),
                "Trần Thị B", // userName vừa thêm
                UUID.fromString("35ee4fa2-5ef6-4c00-9ff9-82b6b8e80bea"),
                branchId,
                LocalDate.parse("2026-04-25"),
                "SCHEDULED",
                null, null, null, null, 0, null
        );
        
        List<ShiftScheduleResult> data = List.of(mockResult1, mockResult2);

        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        String json = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(ApiResponse.ok(data));
        System.out.println("========== JSON OUTPUT ==========");
        System.out.println(json);
        System.out.println("=================================");
    }
}
